import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Shop.css";
import useRequireAuth from "../hooks/useRequireAuth";
import useDept from "../hooks/useDept";

function Shop() {
  const { addToCart } = useCart();
  const { toggleWishlist, isFavorite } = useWishlist();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const dept = useDept();
  const [searchParams] = useSearchParams();

  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "ALL");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy,   setSortBy]   = useState("default");

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/products/`).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/categories/`).then((r) => r.json()),
    ]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
      if (prods.length > 0) {
        const highest = Math.max(...prods.map((p) => Number(p.price)));
        setMaxPrice(highest);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Only show categories that belong to this department (+ unisex)
  const deptCategories = categories.filter(
    (c) => c.gender === dept || c.gender === "unisex"
  );

  // Start from department-scoped products, then apply the rest of the filters
  let filtered = products.filter(
    (p) => !p.category?.gender || p.category.gender === dept || p.category.gender === "unisex"
  );

  if (search)
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

  if (category !== "ALL")
    filtered = filtered.filter(
      (p) => p.category?.name?.toUpperCase() === category
    );

  filtered = filtered.filter((p) => Number(p.price) <= maxPrice);

  if (sortBy === "low")  filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "high") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <Header />
      <section className="shop-page">

        <div className="shop-title">
          <div>
            <h1>SHOP ALL</h1>
            <p className="shop-count">{filtered.length} products</p>
          </div>
        </div>

        <div className="shop-filter-bar">

          <div className="filter-search">
            <span className="filter-icon">🔍</span>
            <input
              type="text"
              placeholder="SEARCH PRODUCTS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-cats">
            <button
              className={category === "ALL" ? "filter-btn active" : "filter-btn"}
              onClick={() => setCategory("ALL")}
            >ALL</button>
            {deptCategories.map((cat) => (
              <button
                key={cat.id}
                className={category === cat.name.toUpperCase() ? "filter-btn active" : "filter-btn"}
                onClick={() => setCategory(cat.name.toUpperCase())}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="filter-controls">
            <div className="price-filter">
              <label>MAX PRICE: <span className="gold-text">₹{maxPrice}</span></label>
              <input
                type="range"
                min="100"
                max={Math.max(...products.map((p) => Number(p.price)), 10000)}
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">SORT BY</option>
              <option value="low">PRICE: LOW → HIGH</option>
              <option value="high">PRICE: HIGH → LOW</option>
              <option value="name">NAME: A → Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="product-grid">
            {[1,2,3,4,5,6].map((i) => (
              <div className="product-card skeleton" key={i}>
                <div className="skeleton-img" />
                <div className="product-card-body">
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="shop-empty">
            <p>NO PRODUCTS FOUND</p>
            <button onClick={() => { setSearch(""); setCategory("ALL"); }}>
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map((item) => (
              <div className="product-card" key={item.id}>

                <button
                  className={`wish-btn ${isFavorite(item.id) ? "wished" : ""}`}
                  onClick={() => requireAuth(() => toggleWishlist(item))}
                  title={isFavorite(item.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  {isFavorite(item.id) ? "❤️" : "🤍"}
                </button>

                {item.discount_percent && (
                  <span className="discount-badge">{item.discount_percent}% OFF</span>
                )}

                <Link to={`/${dept}/product/${item.slug}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400";
                    }}
                  />
                </Link>

                <div className="product-card-body">
                  <p className="card-category">{item.category?.name}</p>
                  <h3>{item.name}</h3>
                  <p className="rating">★★★★★</p>
                  <div className="price-row">
                    {item.discount_price ? (
                      <>
                        <p className="price sale-price">₹{item.discount_price}</p>
                        <p className="old-price">₹{item.price}</p>
                      </>
                    ) : (
                      <p className="price">₹{item.price}</p>
                    )}
                  </div>
                  <div className="card-actions">
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
                    <Link to={`/${dept}/product/${item.slug}`} className="view-btn">
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

export default Shop;

