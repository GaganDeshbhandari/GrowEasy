from rest_framework import generics
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import FarmerPermission
from .models import Product, ProductCategory
from .serializers import ProductReadSerializer, ProductWriteSerializer, ProductCategorySerializer


# 1. ProductListCreateView - List all products and create new product
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True).select_related('farmer').prefetch_related('images', 'categories')

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).select_related('farmer').prefetch_related('images', 'categories')

        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(categories__id=category_id)

        return queryset.distinct()

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

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Use write serializer for validation/update logic.
        write_serializer = ProductWriteSerializer(
            instance,
            data=request.data,
            partial=partial,
            context=self.get_serializer_context(),
        )
        write_serializer.is_valid(raise_exception=True)
        self.perform_update(write_serializer)

        # Refresh the instance so the response includes updated relations
        # (e.g., images/categories) instead of returning stale pre-update data.
        refreshed_instance = (
            self.get_queryset()
            .select_related('farmer')
            .prefetch_related('images', 'categories')
            .get(pk=instance.pk)
        )

        # Always return the full read representation for API consistency.
        read_serializer = ProductReadSerializer(
            refreshed_instance,
            context=self.get_serializer_context(),
        )
        return Response(read_serializer.data, status=status.HTTP_200_OK)


# 3. FarmerProductListView - List products for the logged-in farmer
class FarmerProductListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, FarmerPermission]
    serializer_class = ProductReadSerializer

    def get_queryset(self):
        # Get products for the logged-in farmer
        return Product.objects.filter(
            farmer=self.request.user.farmerprofile
        ).select_related('farmer').prefetch_related('images', 'categories')


# 4. ProductCategoryListView - Public list of all categories (no pagination)
class ProductCategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductCategorySerializer
    pagination_class = None
    queryset = ProductCategory.objects.all().order_by('name')
