from django.urls import path
from .views import *

urlpatterns = [
  path("", ProductListCreateView.as_view(), name="product-listcreate"),
  path("categories/", ProductCategoryListView.as_view(), name="product-categories"),
  path("<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
  path("my-products/", FarmerProductListView.as_view(), name="farmer-products")
]