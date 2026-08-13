import { Link } from "react-router-dom";
import news1 from "../assets/news1.jpg";
import news2 from "../assets/news2.jpg";
import news3 from "../assets/news3.jpg";
import useDept from "../hooks/useDept";

const NEWS_ITEMS = [
  {
    img: news1,
    title: "NEW COLLECTION",
    text: "Timeless pieces. Modern attitude.",
    cta: "EXPLORE NOW ›",
    link: "shop",
  },
  {
    img: news2,
    title: "PREMIUM QUALITY",
    text: "Carefully crafted. Made to last.",
    cta: "LEARN MORE ›",
    link: "shop",
  },
  {
    img: news3,
    title: "EXCLUSIVE ACCESS",
    text: "Be the first to know about new drops and special offers.",
    cta: "SIGN UP NOW ›",
    link: "register",
  },
];

function NewsSidebar({ items = NEWS_ITEMS }) {
  const dept = useDept();

  return (
    <section className="news-section">
      <h2>Daily Fashion News</h2>

      {items.map((item) => (
        <article className="news-card" key={item.title}>
          <img
            src={item.img}
            alt={item.title}
            loading="lazy"
            width={640}
            height={512}
          />

          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>

           <Link
           to={item.link === "register"? "/register": `/${dept}/shop`}>
           {item.cta}
           </Link>
          </div>
        </article>
      ))}
    </section>
  );
}

export default NewsSidebar;