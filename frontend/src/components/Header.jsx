import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import useDept from "../hooks/useDept";

const CROWN = (
  <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M3 8L7 12L12 5L17 12L21 8L19 18H5L3 8Z"
      stroke="#b08d3f"
      strokeWidth="1.2"
      strokeLinejoin="round"
      fill="#b08d3f"
    />
  </svg>
);

function AnimatedTitle({ text }) {
  return (
    <h1 className="masthead-title">
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="title-letter"
          style={{ animationDelay: `${i * 0.045}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h1>
  );
}

/** Sticky nav bar — full-bleed, sits OUTSIDE .paper-sheet on every page. */
export function Navbar() {
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const dept = useDept();

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const wishCount = wishlist.length;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-links">
        <Link to={`/${dept}`}>HOME</Link>
        <Link to={`/${dept}/shop`}>SHOP</Link>
        <Link to={`/${dept}/wishlist`} className="nav-wish">
          WISHLIST {wishCount > 0 && <span className="wish-count">{wishCount}</span>}
        </Link>
      </div>

      <div className="nav-right">
        {user ? (
          <div className="nav-user">
            <Link to="/profile" className="nav-profile-link">👤 {user.username}</Link>
            <button className="nav-logout" onClick={() => logout()}>LOGOUT</button>
          </div>
        ) : (
          <div className="nav-auth">
            <Link to="/login" className="nav-auth-link">LOGIN</Link>
            <Link to="/register" className="nav-auth-btn">JOIN NOW</Link>
          </div>
        )}

        <Link to={`/${dept}/cart`} className="cart-icon">
          CART {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </Link>
      </div>
    </nav>
  );
}

/** Newspaper masthead — lives INSIDE .paper-sheet, Home page only. */
export function Masthead() {
  const dept = useDept();

  return (
    <header>
      <div className="crown-wrap">{CROWN}</div>

      <div className="top-bar">
        <div>
          <p>EST. 2026</p>
          <p>EDITION: 01</p>
        </div>

        <AnimatedTitle text="HOUSE OF DELULU" />

        <div className="dept-toggle">
          <Link to="/men" className={dept === "men" ? "dept-link active" : "dept-link"}>
            MEN&apos;S WEAR
          </Link>
          <Link to="/women" className={dept === "women" ? "dept-link active" : "dept-link"}>
            WOMEN&apos;S WEAR
          </Link>
        </div>
      </div>

      <p className="tagline">CONFIDENCE. STYLE. DELULU.</p>
      <hr className="header-divider" />

      <div className="sub-bar">
        <span>DESIGNED TO BE <span className="gold">REMEMBERED.</span></span>
        <span>WWW.HOUSEOFDELULU.COM</span>
        <span>MADE TO <span className="gold">EMPOWER.</span></span>
      </div>
    </header>
  );
}

/** Backward-compat: pages still doing `import Header from "../components/Header"`
    (Shop, Cart, Wishlist, Profile) keep working unchanged — renders both stacked. */
export default function Header() {
  return (
    <>
      <Navbar />
      <Masthead />
    </>
  );
}

