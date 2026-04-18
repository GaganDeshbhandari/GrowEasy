from django.db import transaction

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from razorpay.errors import SignatureVerificationError

from accounts.models import Address
from accounts.permissions import CustomerPermission
from orders.models import Cart, CartItem, Order, OrderItem
from products.models import Product

from .razorpay_client import client
from .serializers import CreateRazorpayOrderSerializer, VerifyPaymentSerializer


def _finalize_paid_order(order, razorpay_payment_id):
    order_items = list(order.order_items.select_related("product"))
    product_ids = [item.product_id for item in order_items if item.product_id]

    locked_products = {
        product.id: product
        for product in Product.objects.select_for_update().filter(id__in=product_ids)
    }

    for order_item in order_items:
        product = locked_products.get(order_item.product_id)
        if not product:
            raise ValidationError({"detail": f"Product unavailable for {order_item.product_name}"})

        if product.stock < order_item.quantity:
            raise ValidationError({"detail": f"Insufficient stock for {order_item.product_name}"})

        product.stock -= order_item.quantity
        product.save(update_fields=["stock"])

    order.payment_status = Order.PaymentStatus.PAID
    order.razorpay_payment_id = razorpay_payment_id
    order.save(update_fields=["payment_status", "razorpay_payment_id", "updated_at"])

    cart = Cart.objects.filter(customer=order.customer).first()
    if cart:
        CartItem.objects.filter(cart=cart).delete()


class CreateRazorpayOrderView(generics.GenericAPIView):
    serializer_class = CreateRazorpayOrderSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer = request.user.customerprofile
        cart_id = serializer.validated_data["cart_id"]
        address_id = serializer.validated_data["address_id"]

        cart = Cart.objects.filter(id=cart_id, customer=customer).prefetch_related("items__product").first()
        if not cart:
            return Response({"detail": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)

        if not cart.items.exists():
            return Response({"detail": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        address = Address.objects.filter(id=address_id, customer=customer).first()
        if not address:
            return Response({"detail": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

        total_amount = sum(item.quantity * item.product.price for item in cart.items.all())

        order = Order.objects.create(
            customer=customer,
            address_full_name=address.full_name,
            address_phone=address.phone,
            address_line=address.address,
            address_city=address.city,
            address_state=address.state,
            address_pincode=address.pincode,
            address_type=address.address_type,
            payment_status=Order.PaymentStatus.PENDING,
            status=Order.Status.PENDING,
        )

        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                product_price=cart_item.product.price,
                quantity=cart_item.quantity,
            )

        amount_in_paise = int(total_amount * 100)

        try:
            razorpay_order = client.order.create(
                {
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": f"receipt_{order.id}",
                    "payment_capture": 1,
                }
            )
        except Exception:
            return Response({"detail": "Payment gateway error"}, status=status.HTTP_502_BAD_GATEWAY)

        order.razorpay_order_id = razorpay_order.get("id")
        order.save(update_fields=["razorpay_order_id", "updated_at"])

        return Response(
            {
                "razorpay_order_id": razorpay_order.get("id"),
                "amount": amount_in_paise,
                "currency": "INR",
                "order_id": order.id,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyPaymentView(generics.GenericAPIView):
    serializer_class = VerifyPaymentSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        order = Order.objects.filter(id=data["order_id"]).select_related("customer").first()
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.customer != request.user.customerprofile:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        if order.payment_status == Order.PaymentStatus.PAID:
            return Response({"success": True, "order_id": order.id}, status=status.HTTP_200_OK)

        try:
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": data["razorpay_order_id"],
                    "razorpay_payment_id": data["razorpay_payment_id"],
                    "razorpay_signature": data["razorpay_signature"],
                }
            )
        except SignatureVerificationError:
            order.payment_status = Order.PaymentStatus.FAILED
            order.save(update_fields=["payment_status", "updated_at"])
            return Response({"detail": "Payment verification failed"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                locked_order = Order.objects.select_for_update().get(id=order.id)
                if locked_order.payment_status == Order.PaymentStatus.PAID:
                    return Response({"success": True, "order_id": locked_order.id}, status=status.HTTP_200_OK)

                _finalize_paid_order(locked_order, data["razorpay_payment_id"])
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": True, "order_id": order.id}, status=status.HTTP_200_OK)
