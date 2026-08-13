from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Category
from .serializers import (
    ProductSerializer, CategorySerializer,
    CreateOrderSerializer, OrderSerializer
)


# ── PRODUCTS ─────────────────────────────────────────────
@api_view(["GET"])
def product_list(request):
    products = Product.objects.filter(is_active=True)
    category = request.query_params.get("category")
    featured = request.query_params.get("featured")
    if category:
        products = products.filter(category__slug=category)
    if featured:
        products = products.filter(is_featured=True)
    serializer = ProductSerializer(products, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
def product_detail(request, slug):
    try:
        product = Product.objects.get(slug=slug, is_active=True)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)
    serializer = ProductSerializer(product, context={"request": request})
    return Response(serializer.data)


# ── CATEGORIES ────────────────────────────────────────────
@api_view(["GET"])
def category_list(request):
    categories = Category.objects.filter(is_active=True)
    serializer = CategorySerializer(categories, many=True, context={"request": request})
    return Response(serializer.data)


# ── ORDERS ────────────────────────────────────────────────
@api_view(["POST"])
def create_order(request):
    serializer = CreateOrderSerializer(
        data=request.data,
        context={"request": request}
    )
    if serializer.is_valid():
        order = serializer.save()
        # WhatsApp notification handled silently on frontend
        return Response(
            {"message": "Order placed!", "order_id": order.id},
            status=201
        )
    return Response(serializer.errors, status=400)


@api_view(["GET"])
def order_detail(request, order_id):
    try:
        from .models import Order
        order = Order.objects.get(id=order_id)
    except Exception:
        return Response({"error": "Not found"}, status=404)
    serializer = OrderSerializer(order)
    return Response(serializer.data)