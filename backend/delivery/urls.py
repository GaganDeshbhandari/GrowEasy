from django.urls import path

from .views import (
	DeliveryPartnerProfileView,
	DeliveryPartnerAvailabilityView,
	DeliveryPartnerBankDetailListCreateView,
	DeliveryPartnerBankDetailDetailView,
	DeliveryPartnerBankDetailSetPrimaryView,
	DeliveryPartnerOrderListView,
	PickupOrderView,
	VerifyDeliveryOTPView,
	PartnerEarningsView,
)


urlpatterns = [
	path('me/', DeliveryPartnerProfileView.as_view(), name='delivery-profile'),
	path('availability/', DeliveryPartnerAvailabilityView.as_view(), name='delivery-availability'),

	path('bank-details/', DeliveryPartnerBankDetailListCreateView.as_view(), name='delivery-bank-list-create'),
	path('bank-details/<int:pk>/', DeliveryPartnerBankDetailDetailView.as_view(), name='delivery-bank-detail'),
	path('bank-details/<int:pk>/set-primary/', DeliveryPartnerBankDetailSetPrimaryView.as_view(), name='delivery-bank-set-primary'),

	path('orders/', DeliveryPartnerOrderListView.as_view(), name='delivery-orders'),
	path('orders/<int:order_id>/pickup/', PickupOrderView.as_view(), name='delivery-order-pickup'),
	path('orders/<int:order_id>/verify-otp/', VerifyDeliveryOTPView.as_view(), name='delivery-order-verify-otp'),

	path('earnings/', PartnerEarningsView.as_view(), name='delivery-earnings'),
]
