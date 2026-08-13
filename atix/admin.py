from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Category, Brand, Product,
    ProductImage, ProductVariant,
    Order, OrderItem, Review, Coupon
)


# ── USER ──────────────────────────────────────────────
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ["username", "email", "phone", "role", "is_verified", "date_joined"]
    list_filter   = ["role", "is_verified", "is_active"]
    search_fields = ["username", "email", "phone"]
    ordering      = ["-date_joined"]

    fieldsets = UserAdmin.fieldsets + (
        ("ATIX Info", {
            "fields": ("role", "phone", "profile_image", "otp", "otp_created_at", "is_verified")
        }),
    )


# ── CATEGORY ──────────────────────────────────────────
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ["name", "slug", "gender", "is_active"]
    list_filter   = ["gender", "is_active"]
    list_editable = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


# ── BRAND ─────────────────────────────────────────────
@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ["name"]


# ── PRODUCT ───────────────────────────────────────────
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductAdminForm(forms.ModelForm):
    """
    Adds a friendly 'Discount %' field on top of the real model.
    You type a percentage (e.g. 20 for 20% off), and this form
    computes the actual discount_price for you — no more manual
    ₹ math, no more accidental 96%-off products.
    """
    discount_percent = forms.DecimalField(
        required=False,
        min_value=0,
        max_value=90,
        max_digits=5,
        decimal_places=2,
        label="Discount %",
        help_text="Enter a percentage off (e.g. 20 = 20% off). "
                   "Leave blank + leave 'Discount price' blank for no discount. "
                   "This overrides whatever is typed directly into Discount price below.",
    )

    class Meta:
        model = Product
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Pre-fill the % field when editing an existing discounted product,
        # so the admin shows the current discount as a percentage instead
        # of forcing you to do the math in your head.
        instance = getattr(self, "instance", None)
        if instance and instance.pk and instance.price and instance.discount_price:
            try:
                pct = (1 - (instance.discount_price / instance.price)) * 100
                self.fields["discount_percent"].initial = round(pct, 2)
            except (TypeError, ZeroDivisionError):
                pass
        # Discount price is now derived — show it but make clear it's driven by %
        if "discount_price" in self.fields:
            self.fields["discount_price"].required = False
            self.fields["discount_price"].help_text = (
                "Auto-calculated from Discount % above. Only fill this directly "
                "if you intentionally want a fixed override — Discount % wins if both are set."
            )

    def clean(self):
        cleaned = super().clean()
        price = cleaned.get("price")
        pct   = cleaned.get("discount_percent")

        if price and pct not in (None, ""):
            cleaned["discount_price"] = round(price * (1 - (pct / 100)), 2)
        elif not cleaned.get("discount_price"):
            cleaned["discount_price"] = None

        # Safety net — never allow discount_price >= price to slip through
        dp = cleaned.get("discount_price")
        if price and dp is not None and dp >= price:
            raise forms.ValidationError(
                "Discount price must be lower than the original price. "
                "Check your Discount % value."
            )
        return cleaned

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.discount_price = self.cleaned_data.get("discount_price")
        if commit:
            instance.save()
        return instance


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display   = ["name", "category", "price", "discount_price", "discount_pct_display", "stock", "is_featured", "is_active"]
    list_filter    = ["category", "is_featured", "is_active"]
    search_fields  = ["name", "sku"]
    prepopulated_fields = {"slug": ("name",)}
    # NOTE: discount_price removed from list_editable on purpose —
    # inline list editing bypasses the form's % calculation and
    # validation entirely, which is exactly how the 96%-off bug happened.
    list_editable  = ["price", "stock", "is_featured", "is_active"]
    inlines        = [ProductImageInline, ProductVariantInline]

    fields = (
        "category", "brand", "name", "slug", "description",
        "price", "discount_percent", "discount_price",
        "stock", "sku", "image", "is_featured", "is_active",
    )

    @admin.display(description="Off %")
    def discount_pct_display(self, obj):
        if obj.price and obj.discount_price:
            try:
                pct = (1 - (obj.discount_price / obj.price)) * 100
                return f"{pct:.0f}%"
            except ZeroDivisionError:
                return "-"
        return "-"


# ── ORDER ──────────────────────────────────────────────
class OrderItemInline(admin.TabularInline):
    model   = OrderItem
    extra   = 0
    readonly_fields = ["product", "size", "quantity", "price"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display   = ["id", "full_name", "phone", "total", "payment_method", "status", "payment_status", "created_at"]
    list_filter    = ["status", "payment_method", "payment_status"]
    search_fields  = ["full_name", "email", "phone"]
    list_editable  = ["status", "payment_status"]
    readonly_fields = ["user", "full_name", "email", "phone", "address", "city", "pincode", "total", "payment_method", "created_at"]
    inlines        = [OrderItemInline]
    ordering       = ["-created_at"]

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("items")


# ── REVIEW ─────────────────────────────────────────────
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "rating", "created_at"]
    list_filter  = ["rating"]


# ── COUPON ──────────────────────────────────────────────
@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display  = ["code", "discount_type", "discount_value", "min_order",
                     "used_count", "max_uses", "is_active", "expires_at"]
    list_filter   = ["discount_type", "is_active"]
    list_editable = ["is_active"]
    search_fields = ["code"]
    ordering      = ["-created_at"]