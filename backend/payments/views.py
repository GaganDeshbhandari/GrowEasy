from django.db import transaction

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from razorpay.errors import SignatureVerificationError

from accounts.models import Address
from accounts.permissions import CustomerPermission
from orders.models import Cart, CartItem, Order, OrderItem
from products.models import Product

from .razorpay_client import client
from .serializers import CreateRazorpayOrderSerializer, VerifyPaymentSerializer


class CreateRazorpayOrderView(generics.GenericAPIView):
    """
    Step 1 of payment flow.
    Validates cart + address, calculates total, creates a Razorpay order.
    Does NOT create an Order in the DB — that only happens after payment succeeds.
    """
    serializer_class = CreateRazorpayOrderSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer = request.user.customerprofile
        cart_id = serializer.validated_data["cart_id"]
        address_id = serializer.validated_data["address_id"]

        # Validate cart belongs to this customer and is not empty
        cart = Cart.objects.filter(id=cart_id, customer=customer).prefetch_related("items__product").first()
        if not cart:
            return Response({"detail": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)

        if not cart.items.exists():
            return Response({"detail": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        unavailable_items = [
            item.product.name for item in cart.items.all()
            if not item.product or not item.product.is_active
        ]
        if unavailable_items:
            return Response(
                {
                    "error": "Some items in your cart are no longer available",
                    "unavailable_items": unavailable_items,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate address belongs to this customer
        address = Address.objects.filter(id=address_id, customer=customer).first()
        if not address:
            return Response({"detail": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

        # Calculate total from cart items
        total_amount = sum(item.quantity * item.product.price for item in cart.items.all())
        amount_in_paise = int(total_amount * 100)

        # Create Razorpay order only — no DB Order yet
        try:
            razorpay_order = client.order.create(
                {
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": f"cart_{cart_id}",
                    "payment_capture": 1,
                }
            )
        except Exception:
            return Response({"detail": "Payment gateway error"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(
            {
                "razorpay_order_id": razorpay_order.get("id"),
                "amount": amount_in_paise,
                "currency": "INR",
                "cart_id": cart_id,
                "address_id": address_id,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyPaymentView(generics.GenericAPIView):
    """
    Step 2 of payment flow.
    1. Verify Razorpay signature — if invalid, reject immediately.
    2. Only if signature is valid → create Order + OrderItems inside transaction.atomic().
    """
    serializer_class = VerifyPaymentSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # ── Step 1: Verify Razorpay signature first ──
        try:
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": data["razorpay_order_id"],
                    "razorpay_payment_id": data["razorpay_payment_id"],
                    "razorpay_signature": data["razorpay_signature"],
                }
            )
        except SignatureVerificationError:
            return Response(
                {"detail": "Payment verification failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Step 2: Signature valid → create Order inside atomic transaction ──
        customer = request.user.customerprofile
        cart_id = data["cart_id"]
        address_id = data["address_id"]

        try:
            with transaction.atomic():
                # Validate cart belongs to logged-in customer
                cart = Cart.objects.filter(id=cart_id, customer=customer).prefetch_related("items__product").first()
                if not cart:
                    return Response({"detail": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)

                cart_items = list(cart.items.select_related("product"))
                if not cart_items:
                    return Response({"detail": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

                # Validate address belongs to logged-in customer
                address = Address.objects.filter(id=address_id, customer=customer).first()
                if not address:
                    return Response({"detail": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

                # Lock product rows to prevent race conditions
                product_ids = [item.product_id for item in cart_items]
                locked_products = {
                    p.id: p
                    for p in Product.objects.select_for_update().filter(id__in=product_ids)
                }

                # Validate stock for each cart item
                for cart_item in cart_items:
                    product = locked_products.get(cart_item.product_id)
                    if not product:
                        return Response(
                            {"detail": f"Product unavailable: {cart_item.product.name}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    if product.stock < cart_item.quantity:
                        return Response(
                            {"detail": f"Insufficient stock for {product.name}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                # Create Order with payment_status = 'paid' immediately
                order = Order.objects.create(
                    customer=customer,
                    address_full_name=address.full_name,
                    address_phone=address.phone,
                    address_line=address.address,
                    address_city=address.city,
                    address_state=address.state,
                    address_pincode=address.pincode,
                    address_type=address.address_type,
                    razorpay_order_id=data["razorpay_order_id"],
                    razorpay_payment_id=data["razorpay_payment_id"],
                    payment_status=Order.PaymentStatus.PAID,
                    status=Order.Status.PENDING,
                )

                # Create OrderItems with snapshotted prices
                for cart_item in cart_items:
                    product = locked_products[cart_item.product_id]
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        product_name=product.name,
                        product_price=product.price,
                        quantity=cart_item.quantity,
                    )
                    # Deduct stock
                    product.stock -= cart_item.quantity
                    product.save(update_fields=["stock"])

                # Clear cart
                CartItem.objects.filter(cart=cart).delete()

        except Exception as exc:
            # Catch unexpected errors, return safe message
            return Response(
                {"detail": "Order creation failed. Please contact support."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"success": True, "order_id": order.id}, status=status.HTTP_200_OK)
