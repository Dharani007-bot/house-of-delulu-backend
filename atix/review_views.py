from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Review, Product, Order, OrderItem
from .serializers import ReviewSerializer


@api_view(["GET"])
def product_reviews(request, slug):
    """Get all reviews for a product"""
    try:
        product = Product.objects.get(slug=slug)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    reviews = Review.objects.filter(product=product).order_by("-created_at")
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def add_review(request, slug):
    """Add a review — must be logged in"""
    # Check auth via token in header
    from .models import User
    auth_header = request.headers.get("Authorization", "")
    username = request.data.get("username")

    if not username:
        return Response({"error": "Login required to review."}, status=401)

    try:
        user = User.objects.get(username=username, is_verified=True)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=404)

    try:
        product = Product.objects.get(slug=slug)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=404)

    # Check if already reviewed
    if Review.objects.filter(product=product, user=user).exists():
        return Response({"error": "You already reviewed this product."}, status=400)

    rating  = request.data.get("rating")
    comment = request.data.get("comment", "").strip()

    if not rating or int(rating) not in range(1, 6):
        return Response({"error": "Rating must be 1-5."}, status=400)

    review = Review.objects.create(
        product = product,
        user    = user,
        rating  = int(rating),
        comment = comment,
    )

    serializer = ReviewSerializer(review)
    return Response(serializer.data, status=201)


@api_view(["DELETE"])
def delete_review(request, review_id):
    """Delete own review"""
    username = request.data.get("username")
    try:
        from .models import User
        user   = User.objects.get(username=username)
        review = Review.objects.get(id=review_id, user=user)
        review.delete()
        return Response({"message": "Review deleted."})
    except Exception:
        return Response({"error": "Not found or not authorized."}, status=404)