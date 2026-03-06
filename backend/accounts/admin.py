from django.contrib import admin
from .models import CustomUser, FarmerProfile, CustomerProfile

# Register your models here.
admin.site.register(CustomUser)
admin.site.register(FarmerProfile)
admin.site.register(CustomerProfile)
