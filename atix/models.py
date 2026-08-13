from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError


# ── USER ───────────────────────────────────────────────
class User(AbstractUser):
    CUSTOMER = "Customer"
    ADMIN    = "Admin"
    ROLE_CHOICES = [(CUSTOMER, "Customer"), (ADMIN, "Admin")]

    role          = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CUSTOMER)
    phone         = models.CharField(max_length=15, blank=True)
    profile_image = models.ImageField(upload_to="profile_images/", blank=True, null=True)

    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    password_changed_at = models.DateTimeField(blank=True, null=True)


    def __str__(self):
        return self.username

# ── CATEGORY ───────────────────────────────────────────
class Category(models.Model):
    GENDER_CHOICES = [("men", "Men"), ("women", "Women"), ("unisex", "Unisex")]
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="unisex")
    name      = models.CharField(max_length=100)
    slug      = models.SlugField(unique=True)
    image     = models.ImageField(upload_to="category_images/", blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


# ── BRAND ──────────────────────────────────────────────
class Brand(models.Model):
    name = models.CharField(max_length=100)
    logo = models.ImageField(upload_to="brand_logo/", blank=True, null=True)

    def __str__(self):
        return self.name


# ── PRODUCT ────────────────────────────────────────────
class Product(models.Model):
    category       = models.ForeignKey(Category, on_delete=models.CASCADE)
    brand          = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    name           = models.CharField(max_length=200)
    slug           = models.SlugField(unique=True)
    description    = models.TextField()
    price          = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    stock          = models.PositiveIntegerField(default=0)
    sku            = models.CharField(max_length=100, unique=True)
    image          = models.ImageField(upload_to="product/")
    is_featured    = models.BooleanField(default=False)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)   # fixed
    updated_at     = models.DateTimeField(auto_now=True)       # fixed
    def clean(self):
        if self.discount_price is not None and self.discount_price >= self.price:
            raise ValidationError({
                "discount_price": "Discount price must be lower than the original price."
            })

    def __str__(self):
        return self.name


# ── PRODUCT IMAGE (gallery) ─────────────────────────────
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="gallery")
    image   = models.ImageField(upload_to="product/gallery/")
    is_main = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.product.name} image"


# ── PRODUCT VARIANT (size + color) ─────────────────────
class ProductVariant(models.Model):
    SIZE_CHOICES = [("S","S"),("M","M"),("L","L"),("XL","XL"),("XXL","XXL")]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    size    = models.CharField(max_length=10, choices=SIZE_CHOICES)
    color   = models.CharField(max_length=50, blank=True)
    stock   = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} - {self.size}"


# ── ORDER ───────────────────────────────────────────────
class Order(models.Model):
    STATUS = [
        ("pending",   "Pending"),
        ("confirmed", "Confirmed"),
        ("shipped",   "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]
    PAYMENT_METHOD = [("cod", "Cash on Delivery"), ("online", "Online")]

    user           = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    full_name      = models.CharField(max_length=200)
    email          = models.EmailField()
    phone          = models.CharField(max_length=15)
    address        = models.TextField()
    city           = models.CharField(max_length=100)
    pincode        = models.CharField(max_length=10)
    total          = models.DecimalField(max_digits=10, decimal_places=2)
    status         = models.CharField(max_length=20, choices=STATUS, default="pending")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD, default="cod")
    payment_status = models.BooleanField(default=False)
    created_at     = models.DateTimeField(auto_now_add=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=20, blank=True, default="")

    def __str__(self):
        return f"Order #{self.id} - {self.full_name}"


# ── ORDER ITEM ──────────────────────────────────────────
class OrderItem(models.Model):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product  = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    size     = models.CharField(max_length=10, blank=True)
    quantity = models.PositiveIntegerField()
    price    = models.DecimalField(max_digits=10, decimal_places=2)  # price at time of order

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"


# ── REVIEW ──────────────────────────────────────────────
class Review(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    rating     = models.PositiveSmallIntegerField()   # 1–5
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.rating}★"


class Coupon(models.Model):
    DISCOUNT_TYPE = [
        ("percentage", "Percentage %"),
        ("fixed",      "Fixed Amount ₹"),
    ]
    code          = models.CharField(max_length=20, unique=True, help_text="e.g. SALE20")
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE, default="percentage")
    discount_value= models.DecimalField(max_digits=6, decimal_places=2, help_text="20 = 20% or ₹20")
    min_order     = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text="Minimum cart value")
    max_uses      = models.PositiveIntegerField(default=100)
    used_count    = models.PositiveIntegerField(default=0)
    is_active     = models.BooleanField(default=True)
    expires_at    = models.DateTimeField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} — {self.discount_value}{'%' if self.discount_type == 'percentage' else '₹'}"

    def is_valid(self):
        from django.utils import timezone
        if not self.is_active:
            return False, "Coupon is inactive."
        if self.used_count >= self.max_uses:
            return False, "Coupon usage limit reached."
        if self.expires_at and timezone.now() > self.expires_at:
            return False, "Coupon has expired."
        return True, "Valid"