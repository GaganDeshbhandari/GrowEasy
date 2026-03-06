from django.urls import path

from .views import *

urlpatterns = [
  path('register/', RegisterView.as_view(), name='user-register'),
  path('login/', LoginView.as_view(), name='user-login'),
  path('logout/', LogoutView.as_view(), name='user-logout'),
  path('refreshToken/', RefreshView.as_view(), name='token-refresh'),
  path('farmer/profile/',FarmerProfileView.as_view(), name='farmer-profile'),
  path('customer/profile/', CustomerProfileView.as_view(), name='customer-profile')
]