from rest_framework import serializers
from django.contrib.auth import authenticate

from .models import CustomUser

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
      return data