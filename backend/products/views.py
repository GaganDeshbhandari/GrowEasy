from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from accounts.permissions import FarmerPermission
from .models import Product
from .serializers import ProductReadSerializer, ProductWriteSerializer


# 1. ProductListCreateView - List all products and create new product
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True).select_related('farmer').prefetch_related('images', 'categories')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), FarmerPermission()]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductReadSerializer
        return ProductWriteSerializer


# 2. ProductDetailView - Retrieve, update, delete a single product
class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), FarmerPermission()]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductReadSerializer
        return ProductWriteSerializer

    def get_queryset(self):
        if self.request.method == 'GET':
            # Anyone can view
            return Product.objects.select_related('farmer').prefetch_related('images', 'categories')
        # Only allow farmer to update/delete their own products
        return Product.objects.filter(farmer=self.request.user.farmerprofile)


# 3. FarmerProductListView - List products for the logged-in farmer
class FarmerProductListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, FarmerPermission]
    serializer_class = ProductReadSerializer

    def get_queryset(self):
        # Get products for the logged-in farmer
        return Product.objects.filter(
            farmer=self.request.user.farmerprofile
        ).select_related('farmer').prefetch_related('images', 'categories')
