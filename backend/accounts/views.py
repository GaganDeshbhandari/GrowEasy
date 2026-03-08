from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from rest_framework import authentication, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

from .serializers import (
  UserRegistrationSerializer,
  LoginSerializer,
  FarmerProfileSerializer,
  CustomerProfileSerializer,
  AddressSerializer,
  FarmerRatingSerializer
)
from .permissions import FarmerPermission, CustomerPermission
from .models import FarmerProfile, CustomerProfile, Address, FarmerRating


# APIView is more preferred for auth opertaions
# GenericView are preferred for CRUD operations

class RegisterView(APIView):
  permission_classes=[permissions.AllowAny]


  def post(self, request):
    serializer = UserRegistrationSerializer(data=request.data)


    if serializer.is_valid():
      user = serializer.save()
    else:
      return Response(serializer.error_messages, status=status.HTTP_400_BAD_REQUEST)

    token = RefreshToken.for_user(user)

    response_data = {
      "user" : serializer.data,
    }
    response = Response(response_data, status=status.HTTP_201_CREATED)
    response.set_cookie(
      key='access_token',
      value=str(token.access_token),
      max_age=300,  # 5 minutes in seconds
      httponly=True,
      secure=False,  # Set to True in production (HTTPS only)
      samesite='Lax',
      path='/'
    )
    response.set_cookie(
      key='refresh_token',
      value=str(token),
      max_age=86400,  # 24 hours in seconds
      httponly=True,
      secure=False,  # Set to True in production (HTTPS only)
      samesite='Lax',
      path='/'
    )

    return response

class LoginView(APIView):

  permission_classes=[permissions.AllowAny]

  def post(self, request):
    serializer = LoginSerializer(data=request.data)


    if serializer.is_valid():
      user = serializer.validated_data['user']
      token = RefreshToken.for_user(user)
    else:
      return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    response_data = {
      "user" : {
        "id" : user.id,
        "email" : user.email,
        "first_name" : user.first_name,
        "last_name" : user.last_name,
        "role" : user.role
      }
    }

    response = Response(response_data, status=status.HTTP_200_OK)

    response.set_cookie(
      key='access_token',
      value=str(token.access_token),
      max_age=300,
      httponly=True,
      samesite='Lax',
      secure=False
    )

    response.set_cookie(
      key='refresh_token',
      value=str(token),
      max_age=86400,
      httponly=True,
      samesite='Lax',
      secure=False
    )

    return response

class LogoutView(APIView):
  permission_classes=[permissions.IsAuthenticated]

  def post(self, request):
    # access_token = request.
    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
      return Response({'message' : 'No refresh token'}, status=status.HTTP_400_BAD_REQUEST)

    token = RefreshToken(refresh_token)

    try:
      token.blacklist()
    except:
      return Response({'message' : 'Token is already blacklisted'}, status=status.HTTP_400_BAD_REQUEST)
    response_data = {
      'message' : 'Successfully LoggedOut'
    }

    response = Response(response_data, status=status.HTTP_200_OK)

    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')

    return response

class RefreshView(APIView):
  permission_classes=[permissions.AllowAny]

  def post(self, request):
    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
      return Response({'message' : 'No refresh token'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      refresh = RefreshToken(refresh_token)
      new_access_token = str(refresh.access_token)
      new_refresh_token = str(refresh)
    except:
      return Response({'message' : 'Invalid or Expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

    response = Response({'message' : 'Successfully Created the New Tokens'}, status=status.HTTP_200_OK)

    response.set_cookie(
      key='access_token',
      value=new_access_token,
      max_age=300,
      samesite='Lax',
      httponly=True,
      secure=False
      )

    response.set_cookie(
      key='refresh_token',
      value=new_refresh_token,
      httponly=True,
      max_age=86400,
      samesite='Lax',
      secure=False
    )

    return response

class FarmerProfileView(generics.RetrieveUpdateAPIView):
  serializer_class = FarmerProfileSerializer
  permission_classes = [permissions.IsAuthenticated,FarmerPermission]

  def get_object(self):
    return FarmerProfile.objects.get(user=self.request.user)


class CustomerProfileView(generics.RetrieveUpdateAPIView):
  serializer_class = CustomerProfileSerializer
  permission_classes = [permissions.IsAuthenticated, CustomerPermission]

  def get_object(self):
    return CustomerProfile.objects.get(user=self.request.user)


class AddressListCreateView(generics.ListCreateAPIView):
  serializer_class = AddressSerializer
  permission_classes = [permissions.IsAuthenticated, CustomerPermission]

  def get_queryset(self):
    return Address.objects.filter(customer__user=self.request.user)

  def perform_create(self, serializer):
    serializer.save(customer=self.request.user.customerprofile)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
  serializer_class = AddressSerializer
  permission_classes = [permissions.IsAuthenticated, CustomerPermission]

  def get_queryset(self):
    return Address.objects.filter(customer__user=self.request.user)


class SetDefaultAddressView(APIView):
  permission_classes = [permissions.IsAuthenticated, CustomerPermission]

  def patch(self, request, pk):
    customer_profile = request.user.customerprofile
    address = Address.objects.filter(customer=customer_profile, pk=pk).first()

    if not address:
      return Response({'detail': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)

    Address.objects.filter(customer=customer_profile, is_default=True).update(is_default=False)
    address.is_default = True
    address.save()

    return Response(AddressSerializer(address).data, status=status.HTTP_200_OK)


class FarmerRatingView(APIView):
  permission_classes = [permissions.IsAuthenticated, CustomerPermission]

  def post(self, request, pk):
    farmer = get_object_or_404(FarmerProfile, pk=pk)
    customer = request.user.customerprofile

    serializer = FarmerRatingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    rating_obj, created = FarmerRating.objects.update_or_create(
      farmer=farmer,
      customer=customer,
      defaults={'rating': serializer.validated_data['rating']}
    )

    response_serializer = FarmerRatingSerializer(rating_obj)
    response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return Response(response_serializer.data, status=response_status)