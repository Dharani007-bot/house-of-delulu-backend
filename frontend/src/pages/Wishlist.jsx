import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import useDept from "../hooks/useDept";

function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const dept = useDept();

  const deptWishlist = wishlist.filter(
    (product) => !product.category?.gender || product.category.gender === dept || product.category.gender === "unisex"
  );

  return (
    <>
      <Header />
      <section className="shop-page">
        <div className="shop-title">
          <h1>MY WISHLIST</h1>
          <p className="shop-count">{deptWishlist.length} saved items</p>
        </div>

        {deptWishlist.length === 0 ? (
          <div className="shop-empty">
            <p>YOUR WISHLIST IS EMPTY</p>
            <Link to={`/${dept}/shop`}>
              <button>BROWSE SHOP</button>
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {deptWishlist.map((product) => (
              <div className="product-card" key={product.id}>

                <button
                  className="wish-btn wished"
                  onClick={() => toggleWishlist(product)}
                  title="Remove from Wishlist"
                >❤️</button>

                {product.discount_percent && (
                  <span className="discount-badge">{product.discount_percent}% OFF</span>
                )}

                <Link to={`/${dept}/product/${product.slug}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400";
                    }}
                  />
                </Link>

                <div className="product-card-body">
                  <p className="card-category">{product.category?.name}</p>
                  <h3>{product.name}</h3>
                  <p className="rating">★★★★★</p>
                  <div className="price-row">
                    {product.discount_price ? (
                      <>
                        <p className="price sale-price">₹{product.discount_price}</p>
                        <p className="old-price">₹{product.price}</p>
                      </>
                    ) : (
                      <p className="price">₹{product.price}</p>
                    )}
                  </div>
                  <div className="card-actions">
                    <button
                      className="cart-btn"
                      onClick={() => {
                        addToCart({
                          id:       product.id,
                          name:     product.name,
                          price:    parseFloat(product.discount_price || product.price),
                          image:    product.image,
                          category: product.category,
                        });
                        navigate(`/${dept}/cart`);
                      }}
                    >
                      ADD TO CART
                    </button>
                    <Link to={`/${dept}/product/${product.slug}`} className="view-btn">
                      VIEW
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}

export default Wishlist;