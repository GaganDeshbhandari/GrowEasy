from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework import authentication, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

from .serializers import UserRegistrationSerializer, LoginSerializer


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