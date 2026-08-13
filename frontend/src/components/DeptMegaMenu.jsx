import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function DeptMegaMenu({ dept, active }) {
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return; // fetch once, reuse for both hover states
    fetch("http://127.0.0.1:8000/api/categories/")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [loaded]);

  if (!active) return null;

  const deptCategories = categories.filter(
    (c) => c.gender === dept || c.gender === "unisex"
  );

  if (deptCategories.length === 0) return null;

  return (
    <div className="dept-mega-menu">
      {deptCategories.map((cat) => (
        <Link
          key={cat.id}
          to={`/${dept}/shop?category=${encodeURIComponent(cat.name.toUpperCase())}`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}

export default DeptMegaMenu;