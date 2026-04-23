from rest_framework import serializers
from django.db.models import Sum
from django.utils import timezone
from products.serializers import ProductReadSerializer
from products.models import Product
from .models import Cart, CartItem, Order, OrderItem


def _to_non_negative(value):
    return value if value > 0 else 0


def _get_available_stock_for_cart(product, cart):
    now = timezone.now()
    reserved_by_others = (
        CartItem.objects.filter(product=product, reserved_until__gt=now)
        .exclude(cart=cart)
        .aggregate(total_reserved=Sum('quantity'))
        .get('total_reserved')
        or 0
    )
    return _to_non_negative(product.stock - reserved_by_others)


# 1. CartItemSerializer
# This serializer is only for reading Each Items in the Cart
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductReadSerializer(read_only=True)
    total = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    unavailable_reason = serializers.SerializerMethodField()
    reserved_until = serializers.DateTimeField(read_only=True)
    minutes_remaining = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'total', 'available_stock', 'is_available', 'unavailable_reason', 'reserved_until', 'minutes_remaining']

    def get_total(self, obj):
        return obj.total

    def get_available_stock(self, obj):
        if not obj.product:
            return 0
        return _get_available_stock_for_cart(obj.product, obj.cart)

    def get_is_available(self, obj):
        return bool(obj.product and obj.product.is_active)

    def get_unavailable_reason(self, obj):
        if self.get_is_available(obj):
            return None
        return "Product is no longer available"

    def get_minutes_remaining(self, obj):
        if not obj.reserved_until:
            return 0
        remaining_seconds = (obj.reserved_until - timezone.now()).total_seconds()
        if remaining_seconds <= 0:
            return 0
        return int(remaining_seconds // 60)


# CartItemWriteSerializer - for POST/PATCH
# This Serializer is for updating quantity of the items that are already in the cart
class CartItemWriteSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'quantity']

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Product not found or inactive")
        return value

    def validate(self, attrs):
        cart = self.context.get('cart')
        if cart is None and self.instance is not None:
            cart = self.instance.cart

        if cart is None:
            raise serializers.ValidationError({'error': 'Cart not found'})

        if self.instance is not None:
            product = self.instance.product
            requested_quantity = attrs.get('quantity', self.instance.quantity)
        else:
            product_id = attrs.get('product_id')
            if not product_id:
                raise serializers.ValidationError({'product_id': 'This field is required.'})
            product = Product.objects.filter(id=product_id, is_active=True).first()
            if not product:
                raise serializers.ValidationError({'product_id': 'Product not found or inactive'})

            existing_item = CartItem.objects.filter(cart=cart, product=product).first()
            incoming_quantity = attrs.get('quantity', 0)
            requested_quantity = incoming_quantity + (existing_item.quantity if existing_item else 0)

        available_stock = _get_available_stock_for_cart(product, cart)
        if requested_quantity > available_stock:
            raise serializers.ValidationError(
                {
                    'error': f'Only {available_stock}kg available',
                    'available_stock': available_stock,
                }
            )

        return attrs

    def create(self, validated_data):
        product_id = validated_data.pop('product_id')
        cart = self.context['cart']
        product = Product.objects.get(id=product_id)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': validated_data['quantity']}
        )
        if not created:
            cart_item.quantity += validated_data['quantity']
            cart_item.save()
        return cart_item


# 2. CartSerializer
# This Serializer is for getting Entire Cart Info
class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total']
        read_only_fields = ['items']

    def get_total(self, obj):
        return sum(item.total for item in obj.items.all()) or 0


# 3. OrderItemSerializer
"""
This Serializer serializes the Info about the OrderItems.
CartItems gets converted into the OrderItems when Customer taps
on Order
"""

class OrderItemSerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()
    farmer_id = serializers.SerializerMethodField()
    farmer_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity', 'total', 'farmer_id', 'farmer_name']
        read_only_fields = ['product', 'product_name', 'product_price', 'quantity','total', 'farmer_id', 'farmer_name']

    def get_total(self, obj):
        return obj.total

    def get_farmer_id(self, obj):
        return obj.product.farmer.id if obj.product and obj.product.farmer else None

    def get_farmer_name(self, obj):
        return obj.product.farmer.user.fullname if obj.product and obj.product.farmer and obj.product.farmer.user else "Verified Farmer"


# 4. OrderSerializer
"""
This Serializer serializes the Information about the Orders.
And can manipulate the addresss and status using this serializer.
"""
class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    customer = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'customer',
            'address_full_name',
            'address_phone',
            'address_line',
            'address_city',
            'address_state',
            'address_pincode',
            'address_type',
            'status',
            'order_items',
            'total_price',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['customer', 'total_price', 'created_at', 'updated_at', 'order_items']


# OrderWriteSerializer - for POST checkout
"""
Using this Serializer Customer can change the address.
Even after he Orders the Items
"""
class OrderWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'address_full_name',
            'address_phone',
            'address_line',
            'address_city',
            'address_state',
            'address_pincode',
            'address_type'
        ]

# Serializer for Farmer to see who ordered their Products
class FarmerOrderItemSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    unit = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    order_date = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    order_id = serializers.SerializerMethodField()
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'order_id',
            'product_name',
            'quantity',
            'unit',
            'total',
            'customer_name',
            'customer_phone',
            'customer_email',
            'status',
            'address',
            'order_date'
        ]
        read_only_fields = [
            'id',
            'product_name',
            'quantity',
            'unit',
            'total',
            'customer_name',
            'customer_phone',
            'customer_email',
            'status',
            'address',
            'order_date',
        ]

    def get_customer_name(self, obj):
        return obj.order.customer.user.fullname

    def get_customer_phone(self, obj):
        return obj.order.customer.user.phone

    def get_customer_email(self, obj):
        return obj.order.customer.user.email

    def get_unit(self, obj):
        if obj.product and obj.product.unit:
            return obj.product.unit
        return None

    def get_status(self, obj):
        return obj.order.status

    def get_address(self, obj):
        return {
        'full_name': obj.order.address_full_name,
        'phone': obj.order.address_phone,
        'address': obj.order.address_line,
        'city': obj.order.address_city,
        'state': obj.order.address_state,
        'pincode': obj.order.address_pincode,
    }

    def get_order_date(self, obj):
        return obj.order.created_at

    def get_total(self, obj):
        return obj.total

    def get_order_id(self, obj):
        return obj.order.id