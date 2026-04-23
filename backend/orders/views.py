from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import transaction
from accounts.permissions import CustomerPermission, FarmerPermission
from .models import Cart, CartItem, Order, OrderItem
from utils.cart_expiry import clear_expired_cart_items
# from utils.location import haversine
from delivery.models import Delivery, DeliveryPartnerProfile
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    CartItemWriteSerializer,
    OrderSerializer,
    OrderWriteSerializer,
    FarmerOrderItemSerializer
)


# 1. CartView - GET cart for logged-in customer
class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def get_object(self):
        cart, created = Cart.objects.get_or_create(customer=self.request.user.customerprofile)
        clear_expired_cart_items(cart)
        return cart


# 2. CartItemAddView - POST add item to cart
class CartItemAddView(generics.CreateAPIView):
    serializer_class = CartItemWriteSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['cart'] = Cart.objects.get_or_create(
            customer=self.request.user.customerprofile
        )[0]
        return context

    def create(self, request, *args, **kwargs):
        cart, _ = Cart.objects.get_or_create(customer=self.request.user.customerprofile)
        clear_expired_cart_items(cart)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart_item = serializer.save()
        return Response(
            CartItemSerializer(cart_item).data,
            status=status.HTTP_201_CREATED
        )


# 3. CartItemUpdateView - PATCH update quantity, DELETE remove item
class CartItemUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemWriteSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def get_queryset(self):
        return CartItem.objects.filter(cart__customer=self.request.user.customerprofile)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        clear_expired_cart_items(instance.cart)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_item = serializer.save()
        return Response(CartItemSerializer(updated_item).data)


# 4. OrderListCreateView - GET list orders, POST checkout
class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CustomerPermission]

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user.customerprofile,
            payment_status=Order.PaymentStatus.PAID
        ).prefetch_related('order_items')

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return OrderSerializer
        return OrderWriteSerializer

    def create(self, request, *args, **kwargs):
        customer = request.user.customerprofile
        cart = Cart.objects.get(customer=customer)

        # Check if cart has items
        if not cart.items.exists():
            return Response(
                {'detail': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create order with address data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create order
        order = Order.objects.create(
            customer=customer,
            **serializer.validated_data
        )

        # Copy cart items to order items
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                product_price=cart_item.product.price,
                quantity=cart_item.quantity
            )

        # Clear cart
        cart.items.all().delete()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )


# 5. OrderDetailView - GET single order detail
class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user.customerprofile,
            payment_status=Order.PaymentStatus.PAID
        ).prefetch_related('order_items')


# 6. CancelOrderView - PATCH cancel order if status is pending
class CancelOrderView(generics.GenericAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def patch(self, request, pk):
        order = Order.objects.filter(
            pk=pk,
            customer=request.user.customerprofile
        ).prefetch_related('order_items').first()

        if not order:
            return Response(
                {'detail': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status != Order.Status.PENDING:
            return Response(
                {'detail': 'Order cannot be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status'])

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_200_OK
        )

class FarmerOrderListView(generics.ListAPIView):
    serializer_class = FarmerOrderItemSerializer
    permission_classes = [IsAuthenticated, FarmerPermission]

    def get_queryset(self):
        farmer_profile = self.request.user.farmerprofile
        return OrderItem.objects.filter(
            product__farmer=farmer_profile,
            order__payment_status=Order.PaymentStatus.PAID
        )


class DispatchOrderView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, FarmerPermission]

    def patch(self, request, pk):
        farmer_profile = request.user.farmerprofile

        order = Order.objects.filter(
            pk=pk,
            payment_status=Order.PaymentStatus.PAID
        ).prefetch_related('order_items__product__farmer').first()

        if not order:
            return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        has_farmer_item = order.order_items.filter(product__farmer=farmer_profile).exists()
        if not has_farmer_item:
            return Response({'detail': 'You cannot dispatch this order'}, status=status.HTTP_403_FORBIDDEN)

        if order.status in [Order.Status.CANCELLED, Order.Status.DELIVERED]:
            return Response({'detail': 'Order cannot be dispatched'}, status=status.HTTP_400_BAD_REQUEST)

        customer = order.customer
        if customer.latitude is None or customer.longitude is None:
            return Response(
                {'detail': 'Customer location is not available for dispatch'},
                status=status.HTTP_400_BAD_REQUEST
            )

        available_partners = DeliveryPartnerProfile.objects.filter(
            is_available=True,
            latitude__isnull=False,
            longitude__isnull=False,
            user__role='delivery_partner'
        ).select_related('user')

        nearest_partner = None
        nearest_distance = None

        for partner in available_partners:
            distance = haversine(customer.latitude, customer.longitude, partner.latitude, partner.longitude)
            if nearest_distance is None or distance < nearest_distance:
                nearest_distance = distance
                nearest_partner = partner

        if not nearest_partner:
            return Response({'detail': 'No available delivery partner found'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            delivery, _ = Delivery.objects.get_or_create(order=order)
            delivery.partner = nearest_partner
            delivery.save(update_fields=['partner'])

            order.status = Order.Status.DISPATCHED
            order.save(update_fields=['status'])

            nearest_partner.is_available = False
            nearest_partner.save(update_fields=['is_available'])

        return Response(
            {
                'detail': 'Order dispatched successfully',
                'order_id': order.id,
                'status': order.status,
                'delivery_partner': {
                    'id': nearest_partner.id,
                    'name': nearest_partner.user.fullname,
                    'phone': nearest_partner.user.phone,
                },
                'distance_km': round(nearest_distance, 2) if nearest_distance is not None else None,
            },
            status=status.HTTP_200_OK
        )