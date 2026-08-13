# app/atix/throttles.py
# Custom throttle classes for ATIX OUTFITS

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """5 login attempts per minute per IP — brute force protection"""
    scope = 'login'
    rate  = '5/minute'


class RegisterRateThrottle(AnonRateThrottle):
    """10 registrations per hour per IP"""
    scope = 'register'
    rate  = '10/hour'


class OtpRateThrottle(AnonRateThrottle):
    """3 OTP attempts per 5 minutes"""
    scope = 'otp'
    rate  = '5/min'