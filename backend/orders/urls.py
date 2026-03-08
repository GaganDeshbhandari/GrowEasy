from django.urls import path
from .views import (
    CartView,
    CartItemAddView,
    CartItemUpdateDeleteView,
    OrderListCreateView,
    OrderDetailView
)

urlpatterns = [
    # Cart endpoints
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemAddView.as_view(), name='cart-item-add'),
    path('cart/items/<int:pk>/', CartItemUpdateDeleteView.as_view(), name='cart-item-update-delete'),
    
    # Order endpoints
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]