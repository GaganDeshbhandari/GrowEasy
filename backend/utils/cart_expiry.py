from django.utils import timezone
from orders.models import CartItem


def clear_expired_cart_items(cart):
    now = timezone.now()
    expired_items = CartItem.objects.filter(
        cart=cart,
        reserved_until__lt=now,
    )
    expired_count = expired_items.count()
    expired_items.delete()
    return expired_count
