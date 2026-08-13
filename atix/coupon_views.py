from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Coupon


@api_view(["POST"])
def apply_coupon(request):
    """React sends coupon code + cart total → returns discount amount"""
    code       = request.data.get("code", "").strip().upper()
    cart_total = float(request.data.get("cart_total", 0))

    if not code:
        return Response({"error": "Enter a coupon code."}, status=400)

    try:
        coupon = Coupon.objects.get(code=code)
    except Coupon.DoesNotExist:
        return Response({"error": "Invalid coupon code."}, status=404)

    # Validate
    valid, msg = coupon.is_valid()
    if not valid:
        return Response({"error": msg}, status=400)

    # Min order check
    if cart_total < float(coupon.min_order):
        return Response({
            "error": f"Minimum order ₹{coupon.min_order} required for this coupon."
        }, status=400)

    # Calculate discount
    if coupon.discount_type == "percentage":
        discount = round((cart_total * float(coupon.discount_value)) / 100, 2)
    else:
        discount = float(coupon.discount_value)

    # Cap discount at cart total
    discount = min(discount, cart_total)
    final    = round(cart_total - discount, 2)

    return Response({
        "success":      True,
        "code":         coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": float(coupon.discount_value),
        "discount_amount": discount,
        "original_total":  cart_total,
        "final_total":     final,
        "message": f"Coupon applied! You save ₹{discount}"
    })