from django.contrib import admin
from .models import (
	Address,
	CustomUser,
	CustomerProfile,
	FarmerCertification,
	FarmerProfile,
	FarmerRating,
	FarmerBankDetail
)


def register_if_needed(model):
	if model not in admin.site._registry:
		admin.site.register(model)


register_if_needed(CustomUser)
register_if_needed(FarmerProfile)
register_if_needed(CustomerProfile)
register_if_needed(Address)
register_if_needed(FarmerRating)
register_if_needed(FarmerCertification)
register_if_needed(FarmerBankDetail)
