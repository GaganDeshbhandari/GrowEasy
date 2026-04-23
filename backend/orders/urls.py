from django.urls import path
from .views import (
    CartView,
    CartItemAddView,
    CartItemUpdateDeleteView,
    OrderListCreateView,
    OrderDetailView,
    CancelOrderView,
    FarmerOrderListView,
    DispatchOrderView
)

urlpatterns = [
    # Cart endpoints
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemAddView.as_view(), name='cart-item-add'),
    path('cart/items/<int:pk>/', CartItemUpdateDeleteView.as_view(), name='cart-item-update-delete'),

    # Order endpoints
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('farmer-orders/', FarmerOrderListView.as_view(), name='farmer-orders'),
    path('orders/farmer-orders/', FarmerOrderListView.as_view(), name='farmer-orders-legacy'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/cancel/', CancelOrderView.as_view(), name='order-cancel'),
    path('orders/<int:pk>/dispatch/', DispatchOrderView.as_view(), name='order-dispatch'),
]