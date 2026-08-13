import "../styles/OrderSuccess.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const OWNER_PHONE = "919047425082"; // owner number

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const notified = useRef(false);

  const orderId   = location.state?.orderId   || "N/A";
  const cartItems = location.state?.cartItems || [];

  useEffect(() => {
    if (notified.current) return;
    notified.current = true;
    setTimeout(() => sendWhatsApp(), 800);
  }, []);

  function sendWhatsApp() {
    const itemLines = cartItems.length > 0
      ? cartItems.map(i =>
          `  • ${i.name} x${i.quantity} — ₹${i.price * i.quantity}`
        ).join("\n")
      : "  • (see admin panel)";

    const discount   = location.state?.discount     || 0;
    const couponCode = location.state?.couponCode   || "";
    const finalTotal = location.state?.total        ?? cartItems.reduce((s,i)=>s+i.price*i.quantity,0);
    const subtotal    = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

    const msg = encodeURIComponent(
      `🛍️ *NEW ORDER — HOUSE OF DELULU*
📦 *Order ID:* #${orderId}
👤 *Customer:* ${user?.username || "Guest"}
📧 *Email:* ${user?.email || "N/A"}
📱 *Phone:* ${user?.phone || "N/A"}
*Items Ordered:*
${itemLines}
💰 *Subtotal:* ₹${subtotal}
${discount > 0 ? `🎟️ *Coupon (${couponCode}):* − ₹${discount}\n` : ""}💵 *Total:* ₹${finalTotal}
💳 *Status:* Pending
Thank you! 🙏`
    );

    const waWindow = window.open(
      `https://wa.me/${OWNER_PHONE}?text=${msg}`,
      "_blank",
      "width=600,height=400,noopener,noreferrer"
    );

    if (waWindow) {
      setTimeout(() => {
        try { waWindow.close(); } catch (e) {}
      }, 3000);
    }
  }

  return (
    <section className="success">
      <div className="success-card">
        <div className="check">✓</div>
        <h1>Order Confirmed!</h1>
        <p className="order-id">Order #{orderId}</p>
        <p>Thank you for shopping with <strong>HOUSE OF DELULU</strong>.</p>
        <p>Your order has been placed successfully.</p>
        <p>Our team will contact you shortly.</p>

        <div className="success-whatsapp">
          <p>📩 Order notification sent to the store.</p>
        </div>

        <div className="success-actions">
          <button
            className="success-btn-primary"
            onClick={() => navigate("/shop")}
          >
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    </section>
  );
}

export default OrderSuccess;