import random
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from orders.models import Order


class DeliveryPartnerProfile(models.Model):
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name='delivery_partner_profile'
	)
	profile_picture = models.ImageField(upload_to='delivery/profiles/', null=True, blank=True)
	phone_number = models.CharField(max_length=20, blank=True)
	bio = models.TextField(blank=True)
	latitude = models.FloatField(null=True, blank=True)
	longitude = models.FloatField(null=True, blank=True)
	vehicle_number = models.CharField(max_length=50, blank=True)
	driving_license = models.FileField(upload_to='delivery/licenses/', null=True, blank=True)
	vehicle_rc = models.FileField(upload_to='delivery/vehicle-rc/', null=True, blank=True)
	is_available = models.BooleanField(default=False)
	is_profile_complete = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	def save(self, *args, **kwargs):
		self.is_profile_complete = all([
			bool(self.phone_number),
			self.latitude is not None,
			self.longitude is not None,
			bool(self.vehicle_number),
			bool(self.driving_license),
			bool(self.vehicle_rc),
		])
		super().save(*args, **kwargs)

	def __str__(self):
		return f"Delivery Partner: {self.user.fullname}"


class DeliveryPartnerBankDetail(models.Model):
	class PaymentType(models.TextChoices):
		BANK = 'bank', 'Bank'
		UPI = 'upi', 'UPI'

	partner = models.ForeignKey(DeliveryPartnerProfile, on_delete=models.CASCADE, related_name='bank_details')
	type = models.CharField(max_length=10, choices=PaymentType.choices)
	account_holder_name = models.CharField(max_length=200, blank=True)
	bank_name = models.CharField(max_length=200, blank=True)
	account_number = models.CharField(max_length=50, blank=True)
	ifsc_code = models.CharField(max_length=11, blank=True)
	upi_id = models.CharField(max_length=100, blank=True)
	is_primary = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	def save(self, *args, **kwargs):
		if self.is_primary:
			DeliveryPartnerBankDetail.objects.filter(
				partner=self.partner,
				is_primary=True,
			).exclude(pk=self.pk).update(is_primary=False)
		super().save(*args, **kwargs)

	def __str__(self):
		if self.type == 'bank':
			return f"Bank: {self.bank_name} ({self.partner.user.fullname})"
		return f"UPI: {self.upi_id} ({self.partner.user.fullname})"


class Delivery(models.Model):
	order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
	partner = models.ForeignKey(
		DeliveryPartnerProfile,
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name='deliveries'
	)
	picked_at = models.DateTimeField(null=True, blank=True)
	delivered_at = models.DateTimeField(null=True, blank=True)
	delivery_otp = models.CharField(max_length=6, blank=True)
	otp_expires_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def generate_otp(self):
		self.delivery_otp = str(random.randint(100000, 999999))
		self.otp_expires_at = timezone.now() + timedelta(minutes=10)
		self.save(update_fields=['delivery_otp', 'otp_expires_at'])

	def is_otp_expired(self):
		if not self.otp_expires_at:
			return True
		return timezone.now() > self.otp_expires_at

	def __str__(self):
		return f"Delivery for Order #{self.order_id}"


class PartnerEarning(models.Model):
	partner = models.ForeignKey(DeliveryPartnerProfile, on_delete=models.CASCADE, related_name='earnings')
	delivery = models.OneToOneField(Delivery, on_delete=models.CASCADE, related_name='earning')
	amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('50.00'))
	earned_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"₹{self.amount} - {self.partner.user.fullname}"
