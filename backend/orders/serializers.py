from rest_framework import serializers
from products.serializers import ProductReadSerializer
from products.models import Product
from .models import Cart, CartItem, Order, OrderItem


# 1. CartItemSerializer
# This serializer is only for reading Each Items in the Cart
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductReadSerializer(read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'total']

    def get_total(self, obj):
        return obj.total


# CartItemWriteSerializer - for POST/PATCH
# This Serializer is for updating quantity of the items that are already in the cart
class CartItemWriteSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'quantity']

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Product not found or inactive")
        return value

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

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity', 'total']
        read_only_fields = ['product', 'product_name', 'product_price', 'quantity','total']

    def get_total(self, obj):
        return obj.total


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
    class Meta:
        model = OrderItem
        fields = [
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