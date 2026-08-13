import { Link } from "react-router-dom";
import heroImg from "../assets/hero.jpg";
import useDept from "../hooks/useDept";


/** Editorial hero: oversized serif headline left, bleeding photo right.
 *  The button now wraps its text in <span>, matching newspaper.css's
 *  .hero-left button::before gold-wipe hover effect. */
function Hero() {
  const dept = useDept();

  return (
    <section className="hero">
      <div className="hero-left">
        <h2>
          FASHION THAT
          <br />
          SPEAKS <span>YOU.</span>
        </h2>
        <p>
          At House of Delulu, we don't follow trends, we create statements.
          Every piece is designed for the bold, the confident, and the
          beautifully delulu in you.
        </p>
        <Link to={`/${dept}/shop`}>
          <button type="button">
            <span>SHOP THE COLLECTION ▶</span>
          </button>
        </Link>
      </div>

      <div className="hero-right">
        <img
          src={heroImg}
          alt="Woman in a black crested blazer on a city street"
          width={1024}
          height={1280}
        />
      </div>
    </section>
  );
}

export default Hero;

