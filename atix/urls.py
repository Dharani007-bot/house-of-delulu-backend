from django.urls import path
from . import views, auth_views, review_views, coupon_views, profile_views

urlpatterns = [
    # Products
    path("api/products/",              views.product_list,                    name="product-list"),
    path("api/products/<slug:slug>/",  views.product_detail,                  name="product-detail"),
    path("api/categories/",            views.category_list,                   name="category-list"),

    # Orders
    path("api/orders/",                views.create_order,                    name="create-order"),
    path("api/orders/<int:order_id>/", views.order_detail,                    name="order-detail"),

    # Auth
    path("api/auth/register/",         auth_views.register,                   name="register"),
    path("api/auth/verify-otp/",       auth_views.verify_otp,                 name="verify-otp"),
    path("api/auth/resend-otp/",       auth_views.resend_otp,                 name="resend-otp"),
    path("api/auth/login/",            auth_views.login_view,                 name="login"),
    path("api/auth/logout/",           auth_views.logout_view,                name="logout"),

    # Reviews
    path("api/products/<slug:slug>/reviews/", review_views.product_reviews,   name="product-reviews"),
    path("api/products/<slug:slug>/review/",  review_views.add_review,        name="add-review"),
    path("api/reviews/<int:review_id>/",      review_views.delete_review,     name="delete-review"),

    # Coupon
    path("api/coupon/apply/",          coupon_views.apply_coupon,             name="apply-coupon"),

    # Profile
    path("api/profile/",               profile_views.get_profile,             name="get-profile"),
    path("api/profile/update/",        profile_views.update_profile,          name="update-profile"),
    path("api/profile/change-password/", profile_views.change_password,       name="change-password"),
    path("api/profile/orders/",        profile_views.my_orders,               name="my-orders"),
    path("api/profile/delete/",        profile_views.delete_account,          name="delete-account"),

    #profile
    path("api/profile/upload-image/", profile_views.upload_profile_image, name="upload-profile-image"),
]