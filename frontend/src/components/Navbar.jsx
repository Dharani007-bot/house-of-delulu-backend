import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect current department
  const dept = location.pathname.startsWith("/men") ? "men" : "women";

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const wishCount = wishlist.length;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      {/* LEFT NAVIGATION */}

      <div className="nav-links">
        <Link to={`/${dept}`}>HOME</Link>

        <Link to={`/${dept}/shop`}>SHOP</Link>

        <Link
          to={`/${dept}/wishlist`}
          className="nav-wish"
        >
          WISHLIST

          {wishCount > 0 && (
            <span className="wish-count">
              {wishCount}
            </span>
          )}
        </Link>
      </div>

      {/* RIGHT */}

      <div className="nav-right">

        {user ? (
          <div className="nav-user">

            <Link
              to="/profile"
              className="nav-profile-link"
            >
              👤 {user.username}
            </Link>

            <button
              className="nav-logout"
              onClick={() => {
                logout();
                navigate(`/${dept}`);
              }}
            >
              LOGOUT
            </button>

          </div>
        ) : (
          <div className="nav-auth">

            <Link
              to="/login"
              className="nav-auth-link"
            >
              LOGIN
            </Link>

            <Link
              to="/register"
              className="nav-auth-btn"
            >
              JOIN NOW
            </Link>

          </div>
        )}

        <Link
          to={`/${dept}/cart`}
          className="cart-icon"
        >
          CART

          {totalItems > 0 && (
            <span className="cart-count">
              {totalItems}
            </span>
          )}
        </Link>

      </div>
    </nav>
  );
}

export default Navbar;

