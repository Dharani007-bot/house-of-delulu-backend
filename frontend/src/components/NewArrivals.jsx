import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import useRequireAuth from "../hooks/useRequireAuth";
import useDept from "../hooks/useDept";

function NewArrivals() {
  const { addToCart } = useCart();
  const navigate      = useNavigate();
  const requireAuth   = useRequireAuth();
  const dept          = useDept();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const deptProducts = products.filter(
    (p) => !p.category?.gender || p.category.gender === dept || p.category.gender === "unisex"
  );

  if (loading) return (
    <section className="arrivals">
      <h2>NEW ARRIVALS</h2>
      <div className="product-grid newspaper">
        {[1,2,3,4].map((i) => (
          <div className="product-card skeleton" key={i}>
            <div className="skeleton-img" />
            <div className="product-card-body">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (


    <section className="arrivals">
      <h2>NEW ARRIVALS</h2>
      <div className="product-grid newspaper">
        {deptProducts.map((item) => (
          <div className="product-card" key={item.id}>
            {item.discount_percent && (
              <span className="discount-badge">{item.discount_percent}% OFF</span>
            )}

            <Link to={`/${dept}/product/${item.slug}`}>
              <img
                src={item.image}
                alt={item.name}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400";
                }}
              />
            </Link>

            <div className="product-card-body">
              <h3>{item.name}</h3>
              <p className="rating">★★★★★</p>

              <div className="price-row">
                {item.discount_price ? (
                  <>
                    <p className="price sale-price">{item.discount_price}</p>
                    <p className="original-price">₹{item.price}</p>
                  </>
                ) : (
                  <p className="price">{item.price}</p>
                )}
              </div>

              <button
                className="cart-btn"
                onClick={() =>
                  requireAuth(() => {
                    addToCart({
                      id:       item.id,
                      name:     item.name,
                      price:    parseFloat(item.discount_price || item.price),
                      image:    item.image,
                      category: item.category,
                    });
                    navigate(`/${dept}/cart`);
                  })
                }
              >
                ADD TO CART
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>

  );
}

export default NewArrivals;