from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db.models import Avg
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
import random
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
  username = None
  ROLE_CHOICES = [
     ('farmer', 'Farmer'),
     ('customer', 'Customer'),
     ('admin', 'Admin')
  ]
  first_name = models.CharField(max_length=25, null=False, blank=False)
  last_name = models.CharField(max_length=25, null=True, blank=True)
  email = models.EmailField(unique=True)
  created_at = models.DateTimeField(auto_now_add=True)
  phone = models.CharField(max_length=15, unique=True)
  role = models.CharField(choices=ROLE_CHOICES, max_length=15)

  is_active  = models.BooleanField(default=True)
  is_staff   = models.BooleanField(default=False)

  objects = CustomUserManager()


  USERNAME_FIELD = 'email'
  REQUIRED_FIELDS = ['first_name', 'phone','role']

  @property
  def fullname(self):
     return f"{self.first_name} {self.last_name}"

  def __str__(self):
    return f"{self.fullname}"

class FarmerProfile(models.Model):
   GENDER_CHOICES = [
      ('male', 'Male'),
      ('female', 'Female'),
      ('other', 'Other')
   ]
   user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
   picture = models.ImageField(upload_to='farmer/profiles/', null=True, blank=True)
   gender = models.CharField(max_length=40, choices=GENDER_CHOICES, null=True, blank=True)
   location = models.TextField(null=True, blank=True) # will integrate the Maps API for this later

   created_at = models.DateTimeField(auto_now_add=True)
   updated_at = models.DateTimeField(auto_now=True)

   def __str__(self):
      return f"Farmer: {self.user.fullname}"

   @property
   def avg_rating(self):
      ratings = self.ratings.all()
      if not ratings.exists():
         return 0
      return ratings.aggregate(Avg('rating'))['rating__avg']


class CustomerProfile(models.Model):
   user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
   picture = models.ImageField(upload_to='customer/profiles/', null=True, blank=True)

   created_at = models.DateTimeField(auto_now_add=True)
   updated_at = models.DateTimeField(auto_now=True)

   def __str__(self):
      return f"Customer: {self.user.fullname}"


class Address(models.Model):
   class AddressType(models.TextChoices):
      HOME = 'home', 'Home'
      WORK = 'work', 'Work'
      OTHER = 'other', 'Other'

   customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='addresses')
   address_type = models.CharField(max_length=10, choices=AddressType.choices)
   full_name = models.CharField(max_length=200)
   phone = models.CharField(max_length=20)
   address = models.TextField()
   city = models.CharField(max_length=100)
   state = models.CharField(max_length=100)
   pincode = models.CharField(max_length=10)
   is_default = models.BooleanField(default=False)

   created_at = models.DateTimeField(auto_now_add=True)
   updated_at = models.DateTimeField(auto_now=True)

   def save(self, *args, **kwargs):
    if self.is_default:
        Address.objects.filter(
            customer=self.customer,
            is_default=True
        ).update(is_default=False)
    super().save(*args, **kwargs)

   def __str__(self):
      return f"{self.full_name} - {self.address_type}"


class FarmerRating(models.Model):
   farmer = models.ForeignKey(FarmerProfile, on_delete=models.CASCADE, related_name='ratings')
   customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='farmer_ratings')
   rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
   created_at = models.DateTimeField(auto_now_add=True)
   updated_at = models.DateTimeField(auto_now=True)

   class Meta:
      unique_together = ('farmer', 'customer')

   def __str__(self):
      return f"{self.customer.user.fullname} rated {self.farmer.user.fullname}: {self.rating}"


class FarmerCertification(models.Model):
   farmer = models.ForeignKey(FarmerProfile, on_delete=models.CASCADE, related_name='certifications')
   title = models.CharField(max_length=255)
   issued_by = models.CharField(max_length=255, blank=True, null=True)
   issued_date = models.DateField(blank=True, null=True)
   is_verified = models.BooleanField(default=False)
   certificate_image = models.ImageField(upload_to='farmer/certifications/')

   created_at = models.DateTimeField(auto_now_add=True)
   updated_at = models.DateTimeField(auto_now=True)

   def __str__(self):
      return f"{self.title} - {self.farmer.user.fullname}"


class PasswordResetToken(models.Model):
   user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='password_reset_tokens')
   otp= models.CharField(max_length=6)
   created_at = models.DateTimeField(auto_now_add=True)
   expires_at = models.DateTimeField()

   def save(self, *args, **kwargs):
    if not self.otp:
        self.otp = str(random.randint(100000, 999999))
    if not self.expires_at:
        self.expires_at = timezone.now() + timedelta(minutes=10)  # OTP expires in 10 minutes
    super().save(*args, **kwargs)

   def is_expired(self):
      return timezone.now() > self.expires_at

   def __str__(self):
      return f"Password reset token for {self.user.email}"