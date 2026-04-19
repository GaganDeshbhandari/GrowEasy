from rest_framework import serializers
from django.db.models import Sum
from .models import Product, ProductCategory, ProductImage
from accounts.models import FarmerProfile
from orders.models import CartItem

# 1. ProductCategorySerializer
class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ['id', 'name']


# 2. ProductImageSerializer
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary']


# 3. ProductSerializer - Read (with nested images and categories)
class ProductReadSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    categories = ProductCategorySerializer(many=True, read_only=True)
    farmer = serializers.StringRelatedField(read_only=True)
    farmer_id = serializers.IntegerField(source='farmer.id', read_only=True)
    available_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'farmer',
            'farmer_id',
            'name',
            'stock',
            'unit',
            'price',
            'available_stock',
            'categories',
            'images',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['farmer', 'farmer_id', 'created_at', 'updated_at', 'images', 'categories']

    def get_available_stock(self, obj):
        request = self.context.get('request')
        current_cart = None

        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            customer_profile = getattr(request.user, 'customerprofile', None)
            if customer_profile:
                current_cart = getattr(customer_profile, 'cart', None)

        reserved_queryset = CartItem.objects.filter(product=obj)
        if current_cart:
            reserved_queryset = reserved_queryset.exclude(cart=current_cart)

        reserved_by_others = reserved_queryset.aggregate(total_reserved=Sum('quantity')).get('total_reserved') or 0
        available_stock = obj.stock - reserved_by_others
        return available_stock if available_stock > 0 else 0




# 3. ProductSerializer - Write (accepts category IDs)
class ProductWriteSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.all(),
        many=True,
        required=False
    )
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    primary_image_index = serializers.IntegerField(write_only=True, required=False, min_value=0)
    delete_image_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False
    )
    primary_existing_image_id = serializers.IntegerField(write_only=True, required=False, min_value=1)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'stock',
            'unit',
            'price',
            'categories',
            'images',
            'primary_image_index',
            'delete_image_ids',
            'primary_existing_image_id',
            'is_active'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        # Automatically set farmer to the logged-in user's farmer profile
        try:
            farmer = self.context['request'].user.farmerprofile
        except FarmerProfile.DoesNotExist:
            raise serializers.ValidationError("Farmer profile not found")
        categories = validated_data.pop('categories', [])
        images = validated_data.pop('images', [])
        primary_image_index = validated_data.pop('primary_image_index', 0)
        product = Product.objects.create(farmer=farmer, **validated_data)
        product.categories.set(categories)

        if images:
            if primary_image_index >= len(images):
                primary_image_index = 0

            for index, image_file in enumerate(images):
                ProductImage.objects.create(
                    product=product,
                    image=image_file,
                    is_primary=(index == primary_image_index)
                )

        return product

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        images = validated_data.pop('images', None)
        primary_image_index = validated_data.pop('primary_image_index', 0)
        delete_image_ids = validated_data.pop('delete_image_ids', [])
        primary_existing_image_id = validated_data.pop('primary_existing_image_id', None)

        # Update all other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update categories if provided
        if categories is not None:
            instance.categories.set(categories)

        if delete_image_ids:
            instance.images.filter(id__in=delete_image_ids).delete()

        new_images = []
        if images is not None and images:
            if primary_image_index >= len(images):
                primary_image_index = 0

            for index, image_file in enumerate(images):
                new_image = ProductImage.objects.create(
                    product=instance,
                    image=image_file,
                    is_primary=False
                )
                new_images.append(new_image)

        if primary_existing_image_id:
            target_image = instance.images.filter(id=primary_existing_image_id).first()
            if target_image:
                instance.images.update(is_primary=False)
                target_image.is_primary = True
                target_image.save(update_fields=['is_primary'])
        elif new_images:
            instance.images.update(is_primary=False)
            primary_new_image = new_images[primary_image_index]
            primary_new_image.is_primary = True
            primary_new_image.save(update_fields=['is_primary'])

        if instance.images.exists() and not instance.images.filter(is_primary=True).exists():
            fallback_image = instance.images.first()
            fallback_image.is_primary = True
            fallback_image.save(update_fields=['is_primary'])

        return instance
