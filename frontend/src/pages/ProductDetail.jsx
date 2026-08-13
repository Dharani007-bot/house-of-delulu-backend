import "../styles/ProductDetail.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProduct } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import useDept from "../hooks/useDept";

const BASE = `${import.meta.env.VITE_API_URL}`;

function StarRating({ value, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hovered || value) ? "filled" : ""}`}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          style={{ cursor: readOnly ? "default" : "pointer" }}
        >★</span>
      ))}
    </div>
  );
}

function ProductDetail() {
  const { slug }      = useParams();
  const navigate      = useNavigate();
  const { addToCart } = useCart();
  const { user }      = useAuth();
  const dept          = useDept();

  const [product,      setProduct]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError,    setSizeError]    = useState(false);
  const [added,        setAdded]        = useState(false);

  const [reviews,      setReviews]      = useState([]);
  const [revLoading,   setRevLoading]   = useState(true);
  const [rating,       setRating]       = useState(0);
  const [comment,      setComment]      = useState("");
  const [revError,     setRevError]     = useState("");
  const [revSuccess,   setRevSuccess]   = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchProduct(slug)
      .then((data) => {
        if (data.error) setError("Product not found.");
        else setProduct(data);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load."); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetch(`${BASE}/api/products/${slug}/reviews/`)
      .then((r) => r.json())
      .then((data) => { setReviews(data); setRevLoading(false); })
      .catch(() => setRevLoading(false));
  }, [slug]);

  function handleAddToCart() {
    if (!selectedSize) { setSizeError(true); return; }
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.discount_price || product.price),
      image: product.image,
      category: product.category,
      selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!selectedSize) { setSizeError(true); return; }
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.discount_price || product.price),
      image: product.image,
      category: product.category,
      selectedSize,
    });
    navigate(`/${dept}/checkout`);
  }

  async function handleSubmitReview() {
    if (!user) { setRevError("Please login to write a review."); return; }
    if (rating === 0) { setRevError("Please select a star rating."); return; }
    if (!comment.trim()) { setRevError("Please write a comment."); return; }

    setSubmitting(true);
    setRevError("");
    try {
      const res = await fetch(`${BASE}/api/products/${slug}/review/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: user.username, rating, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => [data, ...prev]);
        setRating(0);
        setComment("");
        setRevSuccess("Review submitted! Thank you 🙏");
        setTimeout(() => setRevSuccess(""), 3000);
      } else {
        setRevError(data.error || "Failed to submit.");
      }
    } catch {
      setRevError("Cannot connect to server.");
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return (
    <section className="product-detail">
      <div className="skeleton-box" />
      <div className="product-right">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </section>
  );

  if (error) return (
    <section className="product-detail-error">
      <p>{error}</p>
      <button onClick={() => navigate(`/${dept}`)}>GO BACK</button>
    </section>
  );

  const sizes = product.variants?.length > 0
    ? [...new Set(product.variants.map((v) => v.size))]
    : ["S", "M", "L", "XL", "XXL"];

  return (
    <>
      <section className="product-detail">
        <div className="product-left">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600";
            }}
          />
          {product.gallery?.length > 0 && (
            <div className="gallery-thumbs">
              {product.gallery.map((g) => (
                <img key={g.id} src={g.image} alt="gallery" />
              ))}
            </div>
          )}
        </div>

        <div className="product-right">
          <p className="brand">{product.category?.name || "ATIX"}</p>
          <h1>{product.name}</h1>

          <div className="product-rating">
            <StarRating value={Math.round(avgRating || 0)} readOnly />
            <span className="review-count">
              {avgRating ? `${avgRating} / 5` : "No ratings yet"}
              {reviews.length > 0 && ` · ${reviews.length} reviews`}
            </span>
          </div>

          <div className="product-price">
            {product.discount_price ? (
              <>
                <h2 className="sale-price">₹{product.discount_price}</h2>
                <span className="old-price">₹{product.price}</span>
                {product.discount_percent && (
                  <span className="discount-badge">{product.discount_percent}% OFF</span>
                )}
              </>
            ) : (
              <h2>₹{product.price}</h2>
            )}
            <span className="tax-note">Incl. all taxes</span>
          </div>

          <p className="product-desc">{product.description}</p>

          <div className="size-section">
            <p className="size-label">
              SELECT SIZE
              {sizeError && <span className="size-error"> — Please select a size</span>}
            </p>
            <div className="sizes">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={`size-btn ${selectedSize === size ? "active" : ""}`}
                  onClick={() => { setSelectedSize(size); setSizeError(false); }}
                >{size}</button>
              ))}
            </div>
          </div>

          <ul className="features-list">
            <li>✓ Premium Quality Fabric</li>
            <li>✓ Comfortable Fit</li>
            <li>✓ Machine Washable</li>
            <li>✓ Exclusive Design</li>
          </ul>

          <div className="product-actions">
            <button className="cart-btn" onClick={handleAddToCart}>
              {added ? "✓ ADDED TO CART" : "ADD TO CART"}
            </button>
            <button className="buy-btn" onClick={handleBuyNow}>BUY NOW</button>
          </div>

          <div className="trust-badges">
            <span>🚚 Free Delivery</span>
            <span>↩ Easy Returns</span>
            <span>🔒 Secure Payment</span>
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="reviews-header">
          <h2>CUSTOMER REVIEWS</h2>
          <p>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="review-form-box">
          <h3>WRITE A REVIEW</h3>

          {!user ? (
            <p className="rev-login-msg">
              <a href="/login">Login</a> to write a review.
            </p>
          ) : (
            <>
              {revError   && <div className="rev-error">{revError}</div>}
              {revSuccess && <div className="rev-success">{revSuccess}</div>}

              <div className="rev-form">
                <div className="rev-rating-row">
                  <label>YOUR RATING</label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <div className="rev-comment-row">
                  <label>YOUR REVIEW</label>
                  <textarea
                    placeholder="Share your experience with this product..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </div>
                <button
                  className="rev-submit-btn"
                  onClick={handleSubmitReview}
                  disabled={submitting}
                >
                  {submitting ? "SUBMITTING..." : "SUBMIT REVIEW →"}
                </button>
              </div>
            </>
          )}
        </div>

        {revLoading ? (
          <p className="rev-loading">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="rev-empty">
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((rev) => (
              <div className="review-card" key={rev.id}>
                <div className="rev-top">
                  <div className="rev-user">
                    <span className="rev-avatar">
                      {rev.username[0].toUpperCase()}
                    </span>
                    <div>
                      <p className="rev-name">{rev.username}</p>
                      <p className="rev-date">{rev.created_at}</p>
                    </div>
                  </div>
                  <StarRating value={rev.rating} readOnly />
                </div>
                {rev.comment && (
                  <p className="rev-comment">{rev.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default ProductDetail;

