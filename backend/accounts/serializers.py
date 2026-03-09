from rest_framework import serializers
from django.contrib.auth import authenticate

from .models import CustomUser, FarmerProfile, CustomerProfile, Address, FarmerRating

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
        if normalized not in ['farmer', 'customer']:
            raise serializers.ValidationError("Role must be farmer or customer")
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
    # will add the average_rating later after building the rating model
    # average_rating = serializers.ModelField(read_only=True)
    class Meta:
        model = FarmerProfile
        fields = ['id','user','gender','location','picture','created_at','updated_at']
        read_only_fields = ['created_at', 'updated_at']

class CustomerProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = CustomerProfile
        fields = ['id','user','picture','created_at','updated_at']
        read_only_fields = ['created_at', 'updated_at']


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