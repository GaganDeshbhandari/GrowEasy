from django.contrib import admin
import requests

from .models import (
	Address,
	CustomUser,
	CustomerProfile,
	FarmerCertification,
	FarmerProfile,
	FarmerRating,
	FarmerBankDetail
)


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


@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"user",
		"latitude",
		"longitude",
		"readable_location",
		"created_at",
	)
	readonly_fields = ("readable_location",)

	def readable_location(self, obj):
		if obj.location:
			return obj.location
		return get_readable_location(obj.latitude, obj.longitude)

	readable_location.short_description = "Readable location"


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"user",
		"latitude",
		"longitude",
		"readable_location",
		"created_at",
	)
	readonly_fields = ("readable_location",)

	def readable_location(self, obj):
		return get_readable_location(obj.latitude, obj.longitude)

	readable_location.short_description = "Readable location"


def register_if_needed(model):
	if model not in admin.site._registry:
		admin.site.register(model)


register_if_needed(CustomUser)
register_if_needed(Address)
register_if_needed(FarmerRating)
register_if_needed(FarmerCertification)
register_if_needed(FarmerBankDetail)
