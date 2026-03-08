from django.db import models
from accounts.models import CustomerProfile
from products.models import Product

# Create your models here.
class Cart(models.Model):
    customer   = models.OneToOneField(CustomerProfile, on_delete=models.CASCADE, related_name="cart")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.customer.user.fullname}"

class CartItem(models.Model):
    cart     = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product  = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ("cart", "product")

    def __str__(self):
        return f"{self.quantity} × {self.product.name}"

    @property
    def total(self):
        return self.product.price * self.quantity

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING    = "pending",    "Pending"
        CONFIRMED  = "confirmed",  "Confirmed"
        SHIPPED    = "shipped",    "Shipped"
        DELIVERED  = "delivered",  "Delivered"
        CANCELLED  = "cancelled",  "Cancelled"

    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name="orders")

    # Snapshot of the address at order time
    address_full_name = models.CharField(max_length=200)
    address_phone     = models.CharField(max_length=20)
    address_line      = models.TextField()
    address_city      = models.CharField(max_length=100)
    address_state     = models.CharField(max_length=100)
    address_pincode   = models.CharField(max_length=10)
    address_type      = models.CharField(max_length=10)

    status      = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.pk} — {self.customer.user.fullname} ({self.status})"

    def calculate_total(self):
        self.total_price = sum(item.total for item in self.order_items.all())
        self.save(update_fields=["total_price"])



class OrderItem(models.Model):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="order_items")
    product  = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name="order_items")

    # Snapshot values so the order record is unaffected by later price changes
    product_name  = models.CharField(max_length=255)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity      = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} × {self.product_name} (Order #{self.order.pk})"

    @property
    def total(self):
        return self.product_price * self.quantity

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.order.calculate_total()
