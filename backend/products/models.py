from django.db import models
from django.core.validators import MinValueValidator

from accounts.models import FarmerProfile

class ProductCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = "Product Categories"

    def __str__(self):
        return self.name



class Product(models.Model):
    class Unit(models.TextChoices):
        KG   = "kg",   "Per Kg"
        UNIT = "unit", "Per Unit"

    farmer     = models.ForeignKey(FarmerProfile, on_delete=models.CASCADE, related_name="products")
    name       = models.CharField(max_length=255)
    stock      = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    unit       = models.CharField(max_length=10, choices=Unit.choices)
    price      = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    categories = models.ManyToManyField(ProductCategory, related_name="products", blank=True)

    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.farmer.user.fullname})"




class ProductImage(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image      = models.ImageField(upload_to="products/images/")
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.product.name} (primary={self.is_primary})"

    def save(self, *args, **kwargs):
      if self.is_primary:
        ProductImage.objects.filter(product=self.product, is_primary=True).update(is_primary=False)
      super().save(*args, **kwargs)
