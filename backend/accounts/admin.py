from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(CustomUser)
admin.site.register(FarmerProfile)
admin.site.register(CustomerProfile)
admin.site.register(Address)
admin.site.register(FarmerRating)
admin.site.register(FarmerCertification)
# admin.site.register()
