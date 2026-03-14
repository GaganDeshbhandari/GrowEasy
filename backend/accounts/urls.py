from django.urls import path

from .views import *

urlpatterns = [
  path('register/', RegisterView.as_view(), name='user-register'),
  path('login/', LoginView.as_view(), name='user-login'),
  path('logout/', LogoutView.as_view(), name='user-logout'),
  path('refreshToken/', RefreshView.as_view(), name='token-refresh'),
  path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
  path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
  path('farmer/profile/',FarmerProfileView.as_view(), name='farmer-profile'),
  path('farmers/<int:pk>/public-profile/', FarmerPublicProfileView.as_view(), name='farmer-public-profile'),
  path('farmer/certifications/', FarmerCertificationListCreateView.as_view(), name='farmer-certification-list-create'),
  path('farmer/certifications/<int:pk>/', FarmerCertificationDetailView.as_view(), name='farmer-certification-detail'),
  path('customer/profile/', CustomerProfileView.as_view(), name='customer-profile'),
  path('addresses/', AddressListCreateView.as_view(), name='address-list-create'),
  path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
  path('addresses/<int:pk>/default/', SetDefaultAddressView.as_view(), name='address-set-default'),
  path('farmers/<int:pk>/rate/', FarmerRatingView.as_view(), name='farmer-rating'),
]