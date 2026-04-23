from rest_framework.permissions import BasePermission


class FarmerPermission(BasePermission):
  message = "Only Farmer can Access this"

  def has_permission(self, request, view):
    return request.user.role in ['admin', 'farmer']

class CustomerPermission(BasePermission):
  message = "Only Customer can Access this"

  def has_permission(self, request, view):
    return request.user.role in ['admin', 'customer']


class DeliveryPartnerPermission(BasePermission):
  message = "Only Delivery Partner can Access this"

  def has_permission(self, request, view):
    return request.user.role in ['admin', 'delivery_partner']
