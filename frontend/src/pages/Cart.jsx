import "../styles/Cart.css";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import useDept from "../hooks/useDept";

function Cart() {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const dept = useDept();

  // Only show items that belong to this department (unisex/unknown always shows)
  const deptItems = cartItems.filter(
    (item) => !item.category?.gender || item.category.gender === dept || item.category.gender === "unisex"
  );

  const total = deptItems.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  return (
    <>
      <Header />
      <section className="cart-page">
        <div className="cart-header">
          <h1>YOUR CART</h1>
          <p>{deptItems.length} item{deptItems.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="cart-container">
          <div className="cart-items">
            {deptItems.length === 0 ? (
              <div className="cart-empty">
                <p>YOUR CART IS EMPTY</p>
                <Link to={`/${dept}/shop`}>
                  <button>CONTINUE SHOPPING</button>
                </Link>
              </div>
            ) : (
              deptItems.map((item) => (
                <div className="cart-item" key={`${item.id}-${item.selectedSize || ""}`}>
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-info">
                    <h2>{item.name}</h2>
                    <p className="item-price">₹{item.price}</p>
                    <div className="quantity">
                      <button onClick={() => removeFromCart(item.id, item.selectedSize)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => addToCart(item)}>+</button>
                    </div>
                    <p className="item-total">
                      Subtotal: ₹{item.price * item.quantity}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {deptItems.length > 0 && (
            <div className="summary">
              <h2>ORDER SUMMARY</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="gold-text">FREE</span>
              </div>
              <hr />
              <div className="summary-total">
                <span>TOTAL</span>
                <span>₹{total}</span>
              </div>
              <Link to={`/${dept}/checkout`}>
                <button>PROCEED TO CHECKOUT</button>
              </Link>
              <Link to={`/${dept}`} className="continue-link">
                ← Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Cart;

