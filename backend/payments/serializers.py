from rest_framework import serializers


class CreateRazorpayOrderSerializer(serializers.Serializer):
    cart_id = serializers.IntegerField()
    address_id = serializers.IntegerField()


class VerifyPaymentSerializer(serializers.Serializer):
    razorpay_payment_id = serializers.CharField(max_length=100)
    razorpay_order_id = serializers.CharField(max_length=100)
    razorpay_signature = serializers.CharField()
    order_id = serializers.IntegerField()
