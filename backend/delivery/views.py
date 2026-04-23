from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import DeliveryPartnerPermission
from orders.models import Order

from .models import DeliveryPartnerProfile, DeliveryPartnerBankDetail, Delivery, PartnerEarning
from .serializers import (
	DeliveryPartnerProfileSerializer,
	DeliveryPartnerAvailabilitySerializer,
	DeliveryPartnerBankDetailSerializer,
	DeliverySerializer,
	VerifyDeliveryOTPSerializer,
	PartnerEarningSerializer,
)


class DeliveryPartnerProfileView(generics.RetrieveUpdateAPIView):
	serializer_class = DeliveryPartnerProfileSerializer
	permission_classes = [IsAuthenticated, DeliveryPartnerPermission]

	def get_object(self):
		return DeliveryPartnerProfile.objects.get(user=self.request.user)


class DeliveryPartnerAvailabilityView(generics.UpdateAPIView):
	serializer_class = DeliveryPartnerAvailabilitySerializer
	permission_classes = [IsAuthenticated, DeliveryPartnerPermission]

	def get_object(self):
		return DeliveryPartnerProfile.objects.get(user=self.request.user)

	def patch(self, request, *args, **kwargs):
		profile = self.get_object()

		if request.data.get('is_available') is True and not profile.is_profile_complete:
			return Response(
				{'detail': 'Complete your profile before going available'},
				status=status.HTTP_400_BAD_REQUEST,
			)

		return self.partial_update(request, *args, **kwargs)


class DeliveryPartnerBankDetailListCreateView(generics.ListCreateAPIView):
	serializer_class = DeliveryPartnerBankDetailSerializer
	permission_classes = [IsAuthenticated, DeliveryPartnerPermission]
	pagination_class = None

	def get_queryset(self):
		return DeliveryPartnerBankDetail.objects.filter(
			partner__user=self.request.user
		).order_by('-is_primary', '-created_at')

	def perform_create(self, serializer):
		serializer.save(partner=self.request.user.delivery_partner_profile)


class DeliveryPartnerBankDetailDetailView(generics.RetrieveUpdateDestroyAPIView):
	serializer_class = DeliveryPartnerBankDetailSerializer
	permission_classes = [IsAuthenticated, DeliveryPartnerPermission]

	def get_queryset(self):
		return DeliveryPartnerBankDetail.objects.filter(partner__user=self.request.user)

	def destroy(self, request, *args, **kwargs):
		instance = self.get_object()
		if instance.is_primary:
			return Response(
				{'detail': 'Cannot delete primary payment detail. Set another as primary first.'},
				status=status.HTTP_400_BAD_REQUEST,
			)
		self.perform_destroy(instance)
		return Response(status=status.HTTP_204_NO_CONTENT)


class DeliveryPartnerBankDetailSetPrimaryView(APIView):
	permission_classes = [IsAuthenticated, DeliveryPartnerPermission]

	def patch(self, request, pk):
		profile = request.user.delivery_partner_profile
		bank_detail = DeliveryPartnerBankDetail.objects.filter(partner=profile, pk=pk).first()

		if not bank_detail:
			return Response({'detail': 'Payment detail not found'}, status=status.HTTP_404_NOT_FOUND)

		with transaction.atomic():
			DeliveryPartnerBankDetail.objects.filter(partner=profile, is_primary=True).update(is_primary=False)
			bank_detail.is_primary = True
			bank_detail.save(update_fields=['is_primary'])

		return Response(DeliveryPartnerBankDetailSerializer(bank_detail).data, status=status.HTTP_200_OK)


class DeliveryPartnerOrderListView(generics.ListAPIView):
	serializer_class = DeliverySerializer
	permission_classes = [IsAuthenticated, DeliveryPartnerPermission]

	def get_queryset(self):
		profile = self.request.user.delivery_partner_profile
		queryset = Delivery.objects.filter(partner=profile).select_related('order__customer__user')
		state = self.request.query_params.get('state')

		if state == 'active':
			queryset = queryset.exclude(order__status__in=[Order.Status.DELIVERED, Order.Status.CANCELLED])
		elif state == 'completed':
			queryset = queryset.filter(order__status=Order.Status.DELIVERED)

		return queryset.order_by('-created_at')


class PickupOrderView(APIView):
	permission_classes = [IsAuthenticated, DeliveryPartnerPermission]

	def patch(self, request, order_id):
		profile = request.user.delivery_partner_profile
		delivery = Delivery.objects.filter(order_id=order_id, partner=profile).select_related('order__customer__user').first()

		if not delivery:
			return Response({'detail': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)

		if delivery.order.status not in [Order.Status.DISPATCHED, Order.Status.READY_FOR_PICKUP]:
			return Response({'detail': 'Order is not ready for pickup'}, status=status.HTTP_400_BAD_REQUEST)

		delivery.picked_at = timezone.now()
		delivery.generate_otp()

		delivery.order.status = Order.Status.OUT_FOR_DELIVERY
		delivery.order.save(update_fields=['status'])

		customer_email = delivery.order.customer.user.email
		if customer_email:
			send_mail(
				subject='Delivery OTP for your GrowEasy order',
				message=f"Your delivery OTP is {delivery.delivery_otp}. It expires in 10 minutes.",
				from_email=settings.EMAIL_HOST_USER,
				recipient_list=[customer_email],
				fail_silently=True,
			)

		return Response(DeliverySerializer(delivery).data, status=status.HTTP_200_OK)


class VerifyDeliveryOTPView(APIView):
	permission_classes = [IsAuthenticated, DeliveryPartnerPermission]

	def post(self, request, order_id):
		profile = request.user.delivery_partner_profile
		delivery = Delivery.objects.filter(order_id=order_id, partner=profile).select_related('order').first()

		if not delivery:
			return Response({'detail': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)

		if delivery.order.status != Order.Status.OUT_FOR_DELIVERY:
			return Response({'detail': 'Order is not out for delivery'}, status=status.HTTP_400_BAD_REQUEST)

		serializer = VerifyDeliveryOTPSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		if not delivery.delivery_otp or delivery.is_otp_expired():
			return Response({'detail': 'OTP is expired'}, status=status.HTTP_400_BAD_REQUEST)

		if serializer.validated_data['otp'] != delivery.delivery_otp:
			return Response({'detail': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

		with transaction.atomic():
			delivery.order.status = Order.Status.DELIVERED
			delivery.order.save(update_fields=['status'])

			delivery.delivered_at = timezone.now()
			delivery.delivery_otp = ''
			delivery.otp_expires_at = None
			delivery.save(update_fields=['delivered_at', 'delivery_otp', 'otp_expires_at'])

			PartnerEarning.objects.get_or_create(
				delivery=delivery,
				defaults={'partner': profile},
			)

			profile.is_available = True
			profile.save(update_fields=['is_available'])

		return Response({'detail': 'Order delivered successfully'}, status=status.HTTP_200_OK)


class PartnerEarningsView(APIView):
	permission_classes = [IsAuthenticated, DeliveryPartnerPermission]

	def get(self, request):
		profile = request.user.delivery_partner_profile
		earnings = PartnerEarning.objects.filter(partner=profile).order_by('-earned_at')

		total_earnings = earnings.aggregate(total=Sum('amount')).get('total') or 0
		total_deliveries = earnings.count()

		return Response(
			{
				'total_earnings': total_earnings,
				'total_deliveries': total_deliveries,
				'history': PartnerEarningSerializer(earnings, many=True).data,
			},
			status=status.HTTP_200_OK,
		)
