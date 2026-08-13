import "../styles/Checkout.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Checkout() {
  const { cartItems, clearCart } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [form, setForm] = useState({
    fullName: "", email: user?.email || "", phone: user?.phone || "",
    address: "", city: "", pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  // Coupon state
  const [couponCode,    setCouponCode]    = useState("");
  const [couponData,    setCouponData]    = useState(null);
  const [couponError,   setCouponError]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = couponData?.discount_amount || 0;
  const total    = subtotal - discount;

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.email.trim())    e.email    = "Required";
    if (!form.phone.trim())    e.phone    = "Required";
    if (!form.address.trim())  e.address  = "Required";
    if (!form.city.trim())     e.city     = "Required";
    if (!form.pincode.trim())  e.pincode  = "Required";
    return e;
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponData(null);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/coupon/apply/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: couponCode, cart_total: subtotal }),
      });
      const data = await res.json();
      if (res.ok) setCouponData(data);
      else setCouponError(data.error || "Invalid coupon.");
    } catch {
      setCouponError("Cannot connect to server.");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponData(null);
    setCouponCode("");
    setCouponError("");
  }

  async function handlePlaceOrder() {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:      form.fullName,
          email:          form.email,
          phone:          form.phone,
          address:        form.address,
          city:           form.city,
          pincode:        form.pincode,
          payment_method: paymentMethod,
          coupon_code:    couponData?.code || "",
          items: cartItems.map((item) => ({
            id:           item.id,
            price:        item.price,
            quantity:     item.quantity,
            selectedSize: item.selectedSize || "",
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        clearCart();
        navigate("/success", {
            state: {
                orderId: data.order_id,
                cartItems,
                discount: discount,        // add this
                couponCode: couponData?.code || "",  // add this
                total: total,              // add this (already computed above as subtotal - discount)
                }
            });
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <section className="checkout-empty">
        <p>YOUR CART IS EMPTY</p>
        <button onClick={() => navigate("/")}>GO BACK HOME</button>
      </section>
    );
  }

  return (
    <section className="checkout">
      {/* ── LEFT ── */}
      <div className="checkout-left">
        <div className="checkout-section-title">
          <span className="step-num">01</span>
          <h1>SHIPPING DETAILS</h1>
        </div>

        <div className="form-grid">
          {[
            { label: "Full Name",    name: "fullName", type: "text",  ph: "John Doe" },
            { label: "Email",        name: "email",    type: "email", ph: "john@example.com" },
            { label: "Phone",        name: "phone",    type: "text",  ph: "9876543210" },
            { label: "Address",      name: "address",  type: "text",  ph: "Street, Area", full: true },
            { label: "City",         name: "city",     type: "text",  ph: "Madurai" },
            { label: "Pincode",      name: "pincode",  type: "text",  ph: "625001" },
          ].map(({ label, name, type, ph, full }) => (
            <div className={`form-group ${full ? "full-width" : ""}`} key={name}>
              <label>{label}</label>
              <input
                type={type} name={name} placeholder={ph}
                value={form[name]} onChange={handleChange}
                className={errors[name] ? "error" : ""}
              />
              {errors[name] && <span className="err-msg">{errors[name]}</span>}
            </div>
          ))}
        </div>

        {/* Payment */}
        <div className="checkout-section-title" style={{ marginTop: "40px" }}>
          <span className="step-num">02</span>
          <h1>PAYMENT METHOD</h1>
        </div>
        <div className="payment-options">
          {[
            { value: "cod",    icon: "💵", title: "Cash on Delivery", sub: "Pay when your order arrives" },
            { value: "online", icon: "💳", title: "Online Payment",   sub: "UPI, Cards, Net Banking" },
          ].map(({ value, icon, title, sub }) => (
            <label key={value} className={`payment-option ${paymentMethod === value ? "selected" : ""}`}>
              <input type="radio" name="payment" value={value}
                checked={paymentMethod === value}
                onChange={() => setPaymentMethod(value)} />
              <span className="payment-icon">{icon}</span>
              <div><strong>{title}</strong><p>{sub}</p></div>
            </label>
          ))}
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="checkout-right">
        <h2>ORDER SUMMARY</h2>

        {/* Items */}
        <div className="checkout-items">
          {cartItems.map((item) => (
            <div className="checkout-item" key={item.id}>
              <img src={item.image} alt={item.name || item.title}
                onError={(e) => e.target.src = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100"}
              />
              <div className="checkout-item-info">
                <p className="checkout-item-name">{item.name || item.title}</p>
                {item.selectedSize && <p className="checkout-item-qty">Size: {item.selectedSize}</p>}
                <p className="checkout-item-qty">Qty: {item.quantity}</p>
                <p className="checkout-item-price">₹{item.price * item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── COUPON BOX ── */}
        <div className="coupon-box">
          {couponData ? (
            <div className="coupon-applied">
              <span>🎉 <strong>{couponData.code}</strong> applied!</span>
              <span className="coupon-save">You save ₹{discount}</span>
              <button className="coupon-remove" onClick={removeCoupon}>✕ Remove</button>
            </div>
          ) : (
            <div className="coupon-input-row">
              <input
                type="text"
                placeholder="COUPON CODE"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
              />
              <button onClick={applyCoupon} disabled={couponLoading}>
                {couponLoading ? "..." : "APPLY"}
              </button>
            </div>
          )}
          {couponError && <p className="coupon-error">{couponError}</p>}
        </div>

        {/* Summary rows */}
        <div className="checkout-summary-rows">
          <div className="checkout-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
          {discount > 0 && (
            <div className="checkout-row discount-row">
              <span>Discount ({couponData?.code})</span>
              <span>− ₹{discount}</span>
            </div>
          )}
          <div className="checkout-row"><span>Shipping</span><span className="gold-text">FREE</span></div>
        </div>
        <hr className="checkout-divider" />
        <div className="checkout-total">
          <span>TOTAL</span>
          <span>₹{total.toFixed(2)}</span>
        </div>

        <button className="place-order-btn" onClick={handlePlaceOrder} disabled={loading}>
          {loading ? "PLACING ORDER..." : "PLACE ORDER →"}
        </button>
        <p className="secure-note">🔒 Secure Checkout · Free Returns · COD Available</p>
      </div>
    </section>
  );
}

export default Checkout;

