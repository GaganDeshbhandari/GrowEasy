from rest_framework import generics
from rest_framework import status

from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.cache import cache
from django.conf import settings
from rest_framework.response import Response
from accounts.permissions import FarmerPermission
from utils.distance import get_distance_km
from .models import Product, ProductCategory
from .serializers import (
    ProductCategorySerializer,
    ProductReadSerializer,
    ProductWriteSerializer,
)

DEFAULT_RADIUS_KM = 30
EXPANDED_RADIUS_KM = 100


# 1. ProductListCreateView - List all products and create new product
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True).select_related('farmer').prefetch_related('images', 'categories')

    def get_queryset(self):
        cache_key = "all_active_products"
        cached = cache.get(cache_key)
        queryset = Product.objects.filter(is_active=True).select_related(
            'farmer', 'farmer__user'
        ).prefetch_related('images', 'categories')

        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(categories__id=category_id)

        queryset = list(queryset.distinct())
        cache.set(cache_key,queryset,settings.CACHE_TTL)
        return queryset

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), FarmerPermission()]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductReadSerializer
        return ProductWriteSerializer

    # ── Location helpers ──

    def _get_customer_coordinates(self):
        """
        Priority order:
        1. Query params ?lat=...&lng=... (manual override / GPS)
        2. CustomerProfile lat/lng (if logged in)
        3. None (fallback → no filter)
        """
        request = self.request

        # 1. Query param override
        lat_param = request.query_params.get('lat')
        lng_param = request.query_params.get('lng')
        if lat_param and lng_param:
            try:
                return float(lat_param), float(lng_param)
            except (ValueError, TypeError):
                pass

        # 2. Profile coordinates (only for authenticated customers)
        if request.user and request.user.is_authenticated:
            profile = getattr(request.user, 'customerprofile', None)
            if profile and profile.latitude and profile.longitude:
                return float(profile.latitude), float(profile.longitude)

        # 3. No coordinates available
        return None, None

    def _get_radius(self):
        """Accept optional ?radius=X query param, default to 30."""
        raw = self.request.query_params.get('radius')
        if raw:
            try:
                val = float(raw)
                if 1 <= val <= 500:  # sane bounds
                    return val
            except (ValueError, TypeError):
                pass
        return DEFAULT_RADIUS_KM

    def _filter_by_distance(self, products, lat, lng, radius_km):
        """
        Filter products whose farmer is within radius_km of (lat, lng).
        Returns the filtered list.

        # TODO: Replace with PostGIS spatial query when scaling beyond 10k products
        """
        nearby = []
        for product in products:
            farmer = product.farmer
            if farmer.latitude is None or farmer.longitude is None:
                continue
            dist = get_distance_km(lat, lng, farmer.latitude, farmer.longitude)
            if dist is not None and dist <= radius_km:
                nearby.append(product)
        return nearby

    # ── Override list() to inject location_filter metadata ──

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        customer_lat, customer_lng = self._get_customer_coordinates()

        # No customer location → return all products unfiltered
        if customer_lat is None or customer_lng is None:
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
                response.data['location_filter'] = {'applied': False}
                return response
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'results': serializer.data,
                'location_filter': {'applied': False},
            })

        # Customer has location → apply distance filter
        radius_km = self._get_radius()
        all_products = list(queryset)
        filtered = self._filter_by_distance(all_products, customer_lat, customer_lng, radius_km)
        expanded = False

        # Auto-expand to 100km if empty
        if not filtered and radius_km < EXPANDED_RADIUS_KM:
            filtered = self._filter_by_distance(all_products, customer_lat, customer_lng, EXPANDED_RADIUS_KM)
            if filtered:
                radius_km = EXPANDED_RADIUS_KM
                expanded = True

        # Still empty → return all products
        if not filtered:
            filtered = all_products
            expanded = 'all'

        location_filter = {
            'applied': True,
            'radius_km': radius_km,
            'expanded': expanded,
            'customer_lat': customer_lat,
            'customer_lng': customer_lng,
        }

        # Manual pagination over the filtered list
        page = self.paginate_queryset(filtered)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            response.data['location_filter'] = location_filter
            return response

        serializer = self.get_serializer(filtered, many=True)
        return Response({
            'results': serializer.data,
            'location_filter': location_filter,
        })


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

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        cache_key = f'product_detail_{pk}'
        cached = cache.get(cache_key)

        if cached is not None:
            return Response(cached)

        instance = self.get_object()
        serializer = ProductReadSerializer(
            instance,
            context=self.get_serializer_context()
        )
        cache.set(cache_key, serializer.data, settings.CACHE_TTL)
        return Response(serializer.data)

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

        cache.delete(f'product_detail_{instance.pk}')
        cache.delete('all_active_products')

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

    def perform_destroy(self, instance):
        # Invalidate cache before deleting
        cache.delete(f'product_detail_{instance.pk}')
        cache.delete('all_active_products')
        instance.delete()


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

    def get_queryset(self):
        cache_key = 'product_categories'
        cached = cache.get(cache_key)

        if cached is not None:
            return cached

        queryset = list(ProductCategory.objects.all().order_by('name'))
        cache.set(cache_key, queryset, settings.CACHE_TTL)
        return queryset




