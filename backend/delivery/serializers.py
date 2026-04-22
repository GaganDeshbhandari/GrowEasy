from rest_framework import serializers

from .models import DeliveryPartnerProfile, DeliveryPartnerBankDetail, Delivery, PartnerEarning


class DeliveryPartnerProfileSerializer(serializers.ModelSerializer):
	user = serializers.StringRelatedField(read_only=True)
	first_name = serializers.CharField(source='user.first_name', required=False)
	last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
	email = serializers.EmailField(source='user.email', read_only=True)
	phone = serializers.CharField(source='user.phone', read_only=True)

	class Meta:
		model = DeliveryPartnerProfile
		fields = [
			'id',
			'user',
			'first_name',
			'last_name',
			'email',
			'phone',
			'profile_picture',
			'phone_number',
			'bio',
			'latitude',
			'longitude',
			'vehicle_number',
			'driving_license',
			'vehicle_rc',
			'is_available',
			'is_profile_complete',
			'created_at',
		]
		read_only_fields = ['id', 'user', 'email', 'phone', 'is_profile_complete', 'created_at']

	def update(self, instance, validated_data):
		user_data = validated_data.pop('user', {})

		for attr, value in validated_data.items():
			setattr(instance, attr, value)
		instance.save()

		user = instance.user
		for attr, value in user_data.items():
			setattr(user, attr, value)
		user.save()

		return instance


class DeliveryPartnerAvailabilitySerializer(serializers.ModelSerializer):
	class Meta:
		model = DeliveryPartnerProfile
		fields = ['is_available']


class DeliveryPartnerBankDetailSerializer(serializers.ModelSerializer):
	class Meta:
		model = DeliveryPartnerBankDetail
		fields = [
			'id', 'partner', 'type',
			'account_holder_name', 'bank_name',
			'account_number', 'ifsc_code',
			'upi_id', 'is_primary', 'created_at'
		]
		read_only_fields = ['id', 'partner', 'created_at']

	def validate(self, data):
		payment_type = data.get('type', getattr(self.instance, 'type', None))

		if payment_type == 'bank':
			required = {
				'account_holder_name': 'Account holder name',
				'bank_name': 'Bank name',
				'account_number': 'Account number',
				'ifsc_code': 'IFSC code',
			}
			for field, label in required.items():
				value = data.get(field, getattr(self.instance, field, None) if self.instance else None)
				if not value or not str(value).strip():
					raise serializers.ValidationError({field: f"{label} is required for bank type."})

			ifsc = data.get('ifsc_code', getattr(self.instance, 'ifsc_code', None) if self.instance else None)
			if ifsc and len(ifsc.strip()) != 11:
				raise serializers.ValidationError({'ifsc_code': 'IFSC code must be exactly 11 characters.'})

		elif payment_type == 'upi':
			upi = data.get('upi_id', getattr(self.instance, 'upi_id', None) if self.instance else None)
			if not upi or not str(upi).strip():
				raise serializers.ValidationError({'upi_id': 'UPI ID is required for UPI type.'})
			if '@' not in upi:
				raise serializers.ValidationError({'upi_id': "UPI ID must contain '@'."})

		return data

	def to_representation(self, instance):
		data = super().to_representation(instance)
		raw = instance.account_number
		if raw and len(raw) > 4:
			data['account_number'] = 'X' * (len(raw) - 4) + raw[-4:]
		elif raw:
			data['account_number'] = raw
		return data


class DeliverySerializer(serializers.ModelSerializer):
	order_id = serializers.IntegerField(source='order.id', read_only=True)
	status = serializers.CharField(source='order.status', read_only=True)
	customer_name = serializers.CharField(source='order.customer.user.fullname', read_only=True)
	customer_phone = serializers.CharField(source='order.customer.user.phone', read_only=True)
	address_line = serializers.CharField(source='order.address_line', read_only=True)
	address_city = serializers.CharField(source='order.address_city', read_only=True)
	address_state = serializers.CharField(source='order.address_state', read_only=True)
	address_pincode = serializers.CharField(source='order.address_pincode', read_only=True)

	class Meta:
		model = Delivery
		fields = [
			'id',
			'order_id',
			'status',
			'customer_name',
			'customer_phone',
			'address_line',
			'address_city',
			'address_state',
			'address_pincode',
			'picked_at',
			'delivered_at',
			'created_at',
		]


class VerifyDeliveryOTPSerializer(serializers.Serializer):
	otp = serializers.CharField(max_length=6, min_length=6)


class PartnerEarningSerializer(serializers.ModelSerializer):
	order_id = serializers.IntegerField(source='delivery.order.id', read_only=True)

	class Meta:
		model = PartnerEarning
		fields = ['id', 'order_id', 'amount', 'earned_at']
