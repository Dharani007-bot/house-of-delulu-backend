from decimal import Decimal
from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductVariant, Order, OrderItem, Review


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "name", "slug", "image","gender"]

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ["id", "image", "is_main"]


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductVariant
        fields = ["id", "size", "color", "stock"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    gallery  = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    # Computed discount percentage for frontend to show
    discount_percent = serializers.SerializerMethodField()

    def get_discount_percent(self, obj):
        if obj.discount_price and obj.price > 0:
            saved   = obj.price - obj.discount_price
            percent = (saved / obj.price) * 100
            return round(percent)
        return None

    class Meta:
        model  = Product
        fields = [
            "id", "name", "slug", "description",
            "price", "discount_price", "discount_percent",
            "stock", "image", "is_featured",
            "category", "gallery", "variants",
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source="product.name",  read_only=True)
    product_image = serializers.ImageField(source="product.image", read_only=True)

    class Meta:
        model  = OrderItem
        fields = ["id", "product", "product_name", "product_image",
                  "size", "quantity", "price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model  = Order
        fields = [
            "id", "user", "full_name", "email", "phone",
            "address", "city", "pincode",
            "total", "discount_amount", "coupon_code",
            "status", "payment_method",
            "payment_status", "created_at", "items",
        ]
        read_only_fields = ["id", "user", "total", "status", "payment_status", "created_at"]


class CreateOrderSerializer(serializers.Serializer):
    full_name      = serializers.CharField()
    email          = serializers.EmailField()
    phone          = serializers.CharField()
    address        = serializers.CharField()
    city           = serializers.CharField()
    pincode        = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=["cod", "online"])
    coupon_code    = serializers.CharField(required=False, allow_blank=True)
    items          = serializers.ListField(child=serializers.DictField())

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Cart is empty.")
        return value

    def create(self, validated_data):
        items_data  = validated_data.pop("items")
        coupon_code = validated_data.pop("coupon_code", "")

        # Calculate subtotal
        subtotal = Decimal("0.00")
        for item in items_data:
            subtotal += Decimal(str(item.get("price", "0"))) * int(item.get("quantity", 1))

        # Apply coupon discount
        discount_amount = Decimal("0.00")
        if coupon_code:
            try:
                from .models import Coupon
                coupon = Coupon.objects.get(code=coupon_code.upper(), is_active=True)
                valid, msg = coupon.is_valid()
                if valid and subtotal >= coupon.min_order:
                    if coupon.discount_type == "percentage":
                        discount_amount = (subtotal * coupon.discount_value / 100).quantize(Decimal("0.01"))
                    else:
                        discount_amount = coupon.discount_value
                    discount_amount = min(discount_amount, subtotal)
                    # Increment usage
                    coupon.used_count += 1
                    coupon.save()
            except Exception:
                pass

        final_total = subtotal - discount_amount

        # Link to user if logged in
        request = self.context.get("request")
        user    = request.user if request and request.user.is_authenticated else None

        # Try to find user by email if not authenticated
        if not user:
            try:
                from .models import User
                user = User.objects.get(
                    email=validated_data.get("email"),
                    is_active=True
                )
            except Exception:
                user = None

        order = Order.objects.create(
            total           = final_total,
            discount_amount = discount_amount,
            coupon_code     = coupon_code.upper() if coupon_code else "",
            user            = user,
            **validated_data
        )

        for item in items_data:
            try:
                product = Product.objects.get(id=item["id"])
            except Product.DoesNotExist:
                continue
            OrderItem.objects.create(
                order    = order,
                product  = product,
                size     = item.get("selectedSize", ""),
                quantity = int(item.get("quantity", 1)),
                price    = Decimal(str(item.get("price", "0"))),
            )

        return order


class ReviewSerializer(serializers.ModelSerializer):
    username   = serializers.CharField(source="user.username", read_only=True)
    created_at = serializers.DateTimeField(format="%d %b %Y", read_only=True)

    class Meta:
        model  = Review
        fields = ["id", "username", "rating", "comment", "created_at"]