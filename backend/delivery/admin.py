from django.contrib import admin
import requests

from .models import DeliveryPartnerProfile, DeliveryPartnerBankDetail, Delivery, PartnerEarning

def get_readable_location(latitude, longitude):
	if latitude is None or longitude is None:
		return "-"

	try:
		response = requests.get(
			"https://nominatim.openstreetmap.org/reverse",
			params={
				"format": "jsonv2",
				"lat": str(latitude),
				"lon": str(longitude),
			},
			headers={"User-Agent": "GrowEasyAdmin/1.0"},
			timeout=5,
		)
		response.raise_for_status()
		data = response.json()
		address = data.get("address", {})

		parts = [
			address.get("road") or address.get("suburb") or address.get("neighbourhood"),
			address.get("city") or address.get("town") or address.get("village") or address.get("county"),
			address.get("state"),
		]
		readable = ", ".join([part for part in parts if part])
		return readable or data.get("display_name") or "-"
	except requests.RequestException:
		return "Unable to decode"


@admin.register(DeliveryPartnerProfile)
class DeliveryPartnerProfileAdmin(admin.ModelAdmin):
	list_display = ('id', 'user', 'is_available', 'is_profile_complete', 'created_at','readable_location',)
	readonly_fields = ('readable_location',)
	search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number', 'vehicle_number')
	list_filter = ('is_available', 'is_profile_complete')

	def readable_location(self, obj):
		if obj.latitude and obj.longitude:
			return get_readable_location(obj.latitude, obj.longitude)
	readable_location.short_description = "Readable location"

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
