import re
import random
import secrets
import logging
from datetime import timedelta

from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response

from .models import User
from .throttles import LoginRateThrottle, RegisterRateThrottle, OtpRateThrottle

logger = logging.getLogger('atix')


# ── INPUT VALIDATORS ───────────────────────────────────
def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def is_valid_phone(phone):
    # Indian phone: 10 digits, optionally starting with +91
    cleaned = phone.replace("+91", "").replace(" ", "").replace("-", "")
    return cleaned.isdigit() and len(cleaned) == 10

def is_safe_username(username):
    # Only letters, numbers, underscores — no SQL injection risk
    return re.match(r'^[a-zA-Z0-9_]{3,30}$', username) is not None

def sanitize_input(text, max_length=200):
    """Remove dangerous characters, limit length"""
    if not text:
        return ""
    # Strip HTML tags
    clean = re.sub(r'<[^>]+>', '', str(text))
    return clean.strip()[:max_length]


def generate_otp():
    return str(random.randint(100000, 999999))


def user_payload(user):
    return {
        "id":          user.id,
        "username":    user.username,
        "email":       user.email,
        "phone":       user.phone,
        "is_verified": user.is_verified,
    }


def send_otp_email(email, otp, username):
    subject = "Your ATIX OUTFITS Verification Code"
    message = f"""
Hello {username},

Welcome to ATIX OUTFITS!

Your verification code is:

    {otp}

This code expires in 10 minutes.
Do not share this code with anyone.

If you did not register, please ignore this email.

— ATIX OUTFITS Team
CONFIDENCE. STYLE. LUXURY.
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


# ── REGISTER — with rate limit + validation ────────────
@api_view(["POST"])
@throttle_classes([RegisterRateThrottle])
def register(request):
    # Sanitize all inputs
    username = sanitize_input(request.data.get("username", ""))
    email    = sanitize_input(request.data.get("email",    ""))
    phone    = sanitize_input(request.data.get("phone",    ""))
    password = request.data.get("password", "")

    # Validate
    if not all([username, email, phone, password]):
        return Response({"error": "All fields are required."}, status=400)

    if not is_safe_username(username):
        return Response({"error": "Username: 3-30 chars, letters/numbers/underscore only."}, status=400)

    if not is_valid_email(email):
        return Response({"error": "Enter a valid email address."}, status=400)

    if not is_valid_phone(phone):
        return Response({"error": "Enter a valid 10-digit Indian phone number."}, status=400)

    if len(password) < 8:
        return Response({"error": "Password must be at least 8 characters."}, status=400)

    # Check password strength
    if not re.search(r'[A-Z]', password):
        return Response({"error": "Password must contain at least one uppercase letter."}, status=400)

    if not re.search(r'[0-9]', password):
        return Response({"error": "Password must contain at least one number."}, status=400)

    if User.objects.filter(username__iexact=username).exists():
        return Response({"error": "Username already taken."}, status=400)

    if User.objects.filter(email__iexact=email).exists():
        return Response({"error": "Email already registered."}, status=400)

    otp = generate_otp()

    user = User.objects.create(
        username       = username,
        email          = email.lower(),
        phone          = phone,
        password       = make_password(password),
        otp            = otp,
        otp_created_at = timezone.now(),
        is_verified    = False,
        is_active      = True,
    )

    try:
        send_otp_email(email, otp, username)
    except Exception as e:
        logger.error(f"OTP email failed for {email}: {str(e)}")
        user.delete()
        return Response({"error": "Failed to send verification email. Try again."}, status=500)

    logger.info(f"New user registered: {username}")
    return Response({
        "message": f"OTP sent to {email}. Check your inbox!",
        "user_id": user.id,
        "email":   user.email,
    }, status=201)


# ── VERIFY OTP ─────────────────────────────────────────
@api_view(["POST"])
@throttle_classes([OtpRateThrottle])
def verify_otp(request):
    user_id = request.data.get("user_id")
    otp     = sanitize_input(request.data.get("otp", ""))

    if not user_id or not otp:
        return Response({"error": "User ID and OTP required."}, status=400)

    if not str(otp).isdigit() or len(otp) != 6:
        return Response({"error": "OTP must be 6 digits."}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=404)

    if timezone.now() > user.otp_created_at + timedelta(minutes=10):
        return Response({"error": "OTP expired. Please register again."}, status=400)

    if user.otp != otp:
        logger.warning(f"Invalid OTP attempt for user_id={user_id}")
        return Response({"error": "Invalid OTP."}, status=400)

    user.otp            = None
    user.otp_created_at = None
    user.is_verified    = True
    user.save()

    return Response({
        "message": "Email verified! Welcome to ATIX OUTFITS.",
        "token":   secrets.token_hex(32),
        "user":    user_payload(user),
    })


# ── RESEND OTP ─────────────────────────────────────────
@api_view(["POST"])
@throttle_classes([OtpRateThrottle])
def resend_otp(request):
    user_id = request.data.get("user_id")
    try:
        user = User.objects.get(id=user_id, is_verified=False)
    except User.DoesNotExist:
        return Response({"error": "User not found or already verified."}, status=404)

    new_otp             = generate_otp()
    user.otp            = new_otp
    user.otp_created_at = timezone.now()
    user.save()

    try:
        send_otp_email(user.email, new_otp, user.username)
    except Exception as e:
        logger.error(f"Resend OTP email failed: {str(e)}")
        return Response({"error": "Failed to resend email."}, status=500)

    return Response({"message": "New OTP sent!"})


# ── LOGIN — with brute force protection ────────────────
@api_view(["POST"])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    username = sanitize_input(request.data.get("username", ""))
    password = request.data.get("password", "")

    if not username or not password:
        return Response({"error": "Username and password required."}, status=400)

    user = authenticate(username=username, password=password)

    if user is None:
        # Log failed attempt (security monitoring)
        logger.warning(f"Failed login attempt for username: {username} from IP: {request.META.get('REMOTE_ADDR')}")
        # Generic message — don't reveal if username exists
        return Response({"error": "Invalid username or password."}, status=400)

    if not user.is_verified:
        return Response({
            "error":              "Email not verified. Check your inbox.",
            "user_id":            user.id,
            "email":              user.email,
            "needs_verification": True,
        }, status=400)

    logger.info(f"User logged in: {username}")
    return Response({
        "message": "Login successful!",
        "token":   secrets.token_hex(32),
        "user":    user_payload(user),
    })


# ── LOGOUT ─────────────────────────────────────────────
@api_view(["POST"])
def logout_view(request):
    return Response({"message": "Logged out successfully."})