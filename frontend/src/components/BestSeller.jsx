import bestseller from "../assets/bestseller.jpg";
import { Link } from "react-router-dom";
import useDept from "../hooks/useDept";


function BestSeller() {
    const dept = useDept();

    return (

    <section className="bestseller">
      <div className="best-left">
        <img src={bestseller} alt="Best Seller" />
      </div>
      <div className="best-right">
        <p className="small-title">BEST SELLER</p>
        <h2>OVERSIZED GRAPHIC SHIRT</h2>
        <p>
          Designed for modern men.
          Comfortable, premium and timeless.
        </p>
        <Link to={`/${dept}/shop`}>
          <button>VIEW PRODUCT</button>
        </Link>
      </div>
    </section>

  );
}

export default BestSeller;

