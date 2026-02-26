from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
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

  objects = CustomUserManager()


  USERNAME_FIELD = 'email'
  REQUIRED_FIELDS = ['first_name', 'phone']

  @property
  def fullname(self):
     return f"{self.first_name} {self.last_name}"

  def __str__(self):
    return f"{self.fullname}"
