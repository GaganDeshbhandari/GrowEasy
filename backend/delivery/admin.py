from django.contrib import admin

from .models import DeliveryPartnerProfile, DeliveryPartnerBankDetail, Delivery, PartnerEarning


@admin.register(DeliveryPartnerProfile)
class DeliveryPartnerProfileAdmin(admin.ModelAdmin):
	list_display = ('id', 'user', 'is_available', 'is_profile_complete', 'created_at')
	search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number', 'vehicle_number')
	list_filter = ('is_available', 'is_profile_complete')


@admin.register(DeliveryPartnerBankDetail)
class DeliveryPartnerBankDetailAdmin(admin.ModelAdmin):
	list_display = ('id', 'partner', 'type', 'is_primary', 'created_at')
	search_fields = ('partner__user__email', 'bank_name', 'upi_id')
	list_filter = ('type', 'is_primary')


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
	list_display = ('id', 'order', 'partner', 'picked_at', 'delivered_at', 'created_at')
	search_fields = ('order__id', 'partner__user__email')


@admin.register(PartnerEarning)
class PartnerEarningAdmin(admin.ModelAdmin):
	list_display = ('id', 'partner', 'delivery', 'amount', 'earned_at')
	search_fields = ('partner__user__email',)
