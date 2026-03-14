from rest_framework import serializers
from .models import Product, ProductCategory, ProductImage
from accounts.models import FarmerProfile

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

    class Meta:
        model = Product
        fields = [
            'id',
            'farmer',
            'name',
            'stock',
            'unit',
            'price',
            'categories',
            'images',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['farmer', 'created_at', 'updated_at', 'images', 'categories']


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

        # Update all other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update categories if provided
        if categories is not None:
            instance.categories.set(categories)

        if images is not None:
            instance.images.all().delete()

            if images:
                if primary_image_index >= len(images):
                    primary_image_index = 0

                for index, image_file in enumerate(images):
                    ProductImage.objects.create(
                        product=instance,
                        image=image_file,
                        is_primary=(index == primary_image_index)
                    )

        return instance
