const BASE = "http://localhost:8000/api";

// ── PRODUCTS ────────────────────────────────────────────
export async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res   = await fetch(`${BASE}/products/${query ? "?" + query : ""}`);
  return res.json();
}

export async function fetchProduct(slug) {
  const res = await fetch(`${BASE}/products/${slug}/`);
  return res.json();
}

// ── CATEGORIES ──────────────────────────────────────────
export async function fetchCategories() {
  const res = await fetch(`${BASE}/categories/`);
  return res.json();
}

// ── ORDERS ──────────────────────────────────────────────
export async function placeOrder(orderData) {
  const res = await fetch(`${BASE}/orders/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(orderData),
  });
  return res.json();
}

export async function fetchOrder(orderId) {
  const res = await fetch(`${BASE}/orders/${orderId}/`);
  return res.json();
}