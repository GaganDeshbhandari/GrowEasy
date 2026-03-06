
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import CustomUser, FarmerProfile, CustomerProfile


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

        # Cart will be added later
        # Cart.objects.create(customer=customer_profile)