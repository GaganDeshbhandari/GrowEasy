from django.urls import path

from .views import *

urlpatterns = [
  path('register/', RegisterView.as_view(), name='user-register'),
  path('login/', LoginView.as_view(), name='user-login'),
  path('logout/', LogoutView.as_view(), name='user-logout'),
  path('refreshToken/', RefreshView.as_view(), name='token-refresh'),
]