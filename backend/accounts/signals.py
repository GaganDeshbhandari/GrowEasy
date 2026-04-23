
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import CustomUser, FarmerProfile, CustomerProfile
from delivery.models import DeliveryPartnerProfile
from orders.models import Cart

from django.core.cache import cache

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """
    When a new User is created, automatically create the matching profile
    based on their role, and also create a Cart if they are a Customer.
    """
    if not created:
        return

    if instance.role == 'farmer':
        FarmerProfile.objects.create(user=instance)

    elif instance.role == 'customer':
        customer_profile = CustomerProfile.objects.create(user=instance)
        Cart.objects.create(customer=customer_profile) # Cart is assigned to the customer when he registers

    elif instance.role == 'delivery_partner':
        DeliveryPartnerProfile.objects.create(user=instance)


@receiver(post_save, sender=FarmerProfile)
def invalidate_farmer_profile_cache(sender, instance, **kwargs):
    cache.delete(f'farmer_public_profile_{instance.pk}')