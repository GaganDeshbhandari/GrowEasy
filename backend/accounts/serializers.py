from rest_framework import serializers
from django.contrib.auth import authenticate

from .models import CustomUser, FarmerProfile, CustomerProfile, Address, FarmerRating, FarmerCertification, FarmerBankDetail

class UserRegistrationSerializer(serializers.ModelSerializer):
    # write only make sure that Serializer only takes the input
    # It doesnt return back the write_only field as respo nse
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'password', 'confirm_password', 'role']

    # Method to validate the role
    # Syntax for validation for a specific field is validate_<field_name>
    def validate_role(self, value):
        normalized = value.strip().lower()
        if normalized not in ['farmer', 'customer', 'delivery_partner']:
            raise serializers.ValidationError("Role must be farmer, customer, or delivery_partner")
        return normalized

    # Method to validate between two fields
    # In this case password and confirm_password are two separate fields to validate against them we use Validate
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = CustomUser.objects.create_user(**validated_data)
        return user

    # to_representation method is used to send extra details back
    # def to_representation(self, instance):
    #     return super().to_representation(instance)

class LoginSerializer(serializers.Serializer):

  email = serializers.EmailField()
  password = serializers.CharField(write_only=True)

  def validate(self, data):
      email = data.get('email')
      password = data.get('password')
      user = authenticate(email=email, password=password)

      if user is None:
          raise serializers.ValidationError("Invalid Email or Password")
      if not user.is_active:
          raise serializers.ValidationError("User is Not active")

      data['user'] = user
      data['phone'] = user.phone
      return data


class FarmerProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name', allow_blank=True, required=False)
    email = serializers.EmailField(source='user.email')
    phone = serializers.CharField(source='user.phone')
    # will add the average_rating later after building the rating model
    # average_rating = serializers.ModelField(read_only=True)
    class Meta:
        model = FarmerProfile
        fields = [
            'id',
            'user',
            'first_name',
            'last_name',
            'email',
            'phone',
            'gender',
            'location',
            'latitude',
            'longitude',
            'picture',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

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

class CustomerProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name', allow_blank=True, required=False)
    email = serializers.EmailField(source='user.email')
    phone = serializers.CharField(source='user.phone')

    class Meta:
        model = CustomerProfile
        fields = [
            'id',
            'user',
            'first_name',
            'last_name',
            'email',
            'phone',
            'picture',
            'latitude',
            'longitude',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        return instance


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id',
            'customer',
            'address_type',
            'full_name',
            'phone',
            'address',
            'city',
            'state',
            'pincode',
            'is_default',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['customer', 'created_at', 'updated_at']


class FarmerRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerRating
        fields = ['id', 'farmer', 'customer', 'rating', 'created_at']
        read_only_fields = ['farmer', 'customer', 'created_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return value


class FarmerCertificationSerializer(serializers.ModelSerializer):
    # certificate_name = serializers.CharField(source='title')

    class Meta:
        model = FarmerCertification
        fields = [
            'id',
            'title',
            'farmer',
            'issued_by',
            'issued_date',
            'certificate_image',
            'is_verified',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['farmer', 'is_verified', 'created_at', 'updated_at']


class FarmerPublicProfileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    certifications = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()

    class Meta:
        model = FarmerProfile
        fields = [
            'id',
            'name',
            'picture',
            'location',
            'latitude',
            'longitude',
            'avg_rating',
            'certifications',
            'total_products',
        ]

    def get_name(self, obj):
        return obj.user.fullname

    def get_avg_rating(self, obj):
        return obj.avg_rating

    def get_certifications(self, obj):
        verified_certifications = obj.certifications.filter(is_verified=True)
        return FarmerCertificationSerializer(verified_certifications, many=True, context=self.context).data

    def get_total_products(self, obj):
        return obj.products.count()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return data


class FarmerBankDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerBankDetail
        fields = [
            'id', 'farmer', 'type',
            'account_holder_name', 'bank_name',
            'account_number', 'ifsc_code',
            'upi_id', 'is_primary', 'created_at'
        ]
        read_only_fields = ['id', 'farmer', 'created_at']

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
                raise serializers.ValidationError({'ifsc_code': "IFSC code must be exactly 11 characters."})

        elif payment_type == 'upi':
            upi = data.get('upi_id', getattr(self.instance, 'upi_id', None) if self.instance else None)
            if not upi or not str(upi).strip():
                raise serializers.ValidationError({'upi_id': "UPI ID is required for UPI type."})
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
