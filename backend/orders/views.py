from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from accounts.permissions import CustomerPermission
from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    CartItemWriteSerializer,
    OrderSerializer,
    OrderWriteSerializer
)


# 1. CartView - GET cart for logged-in customer
class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated, CustomerPermission]

    def get_object(self):
        cart, created = Cart.objects.get_or_create(customer=self.request.user.customerprofile)
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
        if 'quantity' in request.data:
            instance.quantity = request.data['quantity']
            instance.save()
        return Response(CartItemSerializer(instance).data)


# 4. OrderListCreateView - GET list orders, POST checkout
class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CustomerPermission]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user.customerprofile).prefetch_related('order_items')

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
        return Order.objects.filter(customer=self.request.user.customerprofile).prefetch_related('order_items')
