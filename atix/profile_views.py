import re
import logging
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from .models import User, Order
from .serializers import OrderSerializer
from .auth_views import sanitize_input, is_valid_email, is_valid_phone

logger = logging.getLogger('atix')

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


def get_user_from_request(request):
    """Get user safely from username in request data"""
    username = request.data.get("username") or request.query_params.get("username")
    if not username:
        return None
    try:
        return User.objects.get(username=username, is_verified=True, is_active=True)
    except User.DoesNotExist:
        return None


def profile_image_url(request, user):
    if user.profile_image:
        return request.build_absolute_uri(user.profile_image.url)
    return None


@api_view(["GET"])
def get_profile(request):
    """Get logged-in user's profile"""
    username = request.query_params.get("username")
    if not username:
        return Response({"error": "Username required."}, status=400)

    try:
        user = User.objects.get(username=username, is_active=True)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=404)

    return Response({
        "id":           user.id,
        "username":     user.username,
        "email":        user.email,
        "phone":        user.phone,
        "first_name":   user.first_name,
        "last_name":    user.last_name,
        "date_joined":  user.date_joined.strftime("%d %b %Y"),
        "is_verified":  user.is_verified,
        "profile_image": profile_image_url(request, user),
        "password_changed_at": (
            user.password_changed_at.strftime("%d %b %Y, %I:%M %p")
            if user.password_changed_at else "Never changed since signup"
        ),
    })


@api_view(["PUT"])
def update_profile(request):
    """Update name and phone only — email change needs re-verification"""
    user = get_user_from_request(request)
    if not user:
        return Response({"error": "User not found."}, status=404)

    first_name = sanitize_input(request.data.get("first_name", ""), 50)
    last_name  = sanitize_input(request.data.get("last_name",  ""), 50)
    phone      = sanitize_input(request.data.get("phone", ""), 15)

    if phone and not is_valid_phone(phone):
        return Response({"error": "Invalid phone number."}, status=400)

    if first_name: user.first_name = first_name
    if last_name:  user.last_name  = last_name
    if phone:      user.phone      = phone
    user.save()

    logger.info(f"Profile updated: {user.username}")
    return Response({"message": "Profile updated successfully!"})


@api_view(["POST"])
def upload_profile_image(request):
    """Upload/replace profile picture"""
    user = get_user_from_request(request)
    if not user:
        return Response({"error": "User not found."}, status=404)

    image = request.FILES.get("profile_image")
    if not image:
        return Response({"error": "No image provided."}, status=400)

    if image.content_type not in ALLOWED_IMAGE_TYPES:
        return Response({"error": "Only JPEG, PNG, or WEBP images are allowed."}, status=400)

    if image.size > MAX_IMAGE_SIZE:
        return Response({"error": "Image must be under 5MB."}, status=400)

    user.profile_image = image
    user.save()

    logger.info(f"Profile image updated: {user.username}")
    return Response({
        "message": "Profile photo updated!",
        "profile_image": profile_image_url(request, user),
    })


@api_view(["POST"])
def change_password(request):
    """Change password — requires current password verification"""
    user = get_user_from_request(request)
    if not user:
        return Response({"error": "User not found."}, status=404)

    current_password = request.data.get("current_password", "")
    new_password     = request.data.get("new_password", "")
    confirm_password = request.data.get("confirm_password", "")

    if not check_password(current_password, user.password):
        logger.warning(f"Wrong current password attempt: {user.username}")
        return Response({"error": "Current password is incorrect."}, status=400)

    if len(new_password) < 8:
        return Response({"error": "New password must be at least 8 characters."}, status=400)

    if not re.search(r'[A-Z]', new_password):
        return Response({"error": "Password must contain at least one uppercase letter."}, status=400)

    if not re.search(r'[0-9]', new_password):
        return Response({"error": "Password must contain at least one number."}, status=400)

    if new_password != confirm_password:
        return Response({"error": "Passwords do not match."}, status=400)

    if current_password == new_password:
        return Response({"error": "New password must be different from current."}, status=400)

    user.password = make_password(new_password)
    user.password_changed_at = timezone.now()   # ← real timestamp now
    user.save()

    logger.info(f"Password changed: {user.username}")
    return Response({"message": "Password changed successfully!"})


@api_view(["GET"])
def my_orders(request):
    """Get all orders for the logged-in user"""
    username = request.query_params.get("username")
    if not username:
        return Response({"error": "Username required."}, status=400)

    try:
        user = User.objects.get(username=username, is_active=True)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=404)

    orders = Order.objects.filter(user=user).order_by("-created_at")
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def delete_account(request):
    """Soft delete — deactivate account instead of hard delete."""
    user = get_user_from_request(request)
    if not user:
        return Response({"error": "User not found."}, status=404)

    password = request.data.get("password", "")
    if not check_password(password, user.password):
        return Response({"error": "Incorrect password."}, status=400)

    user.is_active   = False
    user.is_verified = False
    user.email       = f"deleted_{user.id}_{user.email}"
    user.save()

    logger.info(f"Account deactivated: {user.username}")
    return Response({"message": "Account deleted successfully."})