import { Link } from "react-router-dom";
import useScrollReveal from "../hooks/useScrollReveal";
import useDept from "../hooks/useDept";

import arrival1 from "../assets/arrival1.jpg";
import bestseller from "../assets/bestseller.jpg";
import promise from "../assets/promise.jpg";
import beyou from "../assets/beyou.jpg";

function QuickLinks() {
  const reveal = useScrollReveal();
  const dept = useDept();

  const items = [
    {
      title: "New Arrivals",
      image: arrival1,
      text: "Fresh styles. Bold fits. Made for every version of you.",
      cta: "SHOP NOW ›",
      link: `/${dept}/shop`,
    },
    {
      title: "Best Sellers",
      image: bestseller,
      text: "Loved by many. Chosen by you.",
      cta: "SHOP BEST SELLERS ›",
      link: `/${dept}/shop`,
    },
    {
      title: "Our Promise",
      image: promise,
      text: "Premium fabrics. Unique designs. Made to empower.",
      cta: "LEARN MORE ›",
      link: `/${dept}/shop`,
    },
    {
      title: "Be Delulu. Be You.",
      image: beyou,
      text: "This is more than fashion. It's a lifestyle.",
      cta: "JOIN THE MOVEMENT ›",
      link: `/${dept}/shop`,
    },
  ];

  return (


    <section
      ref={reveal}
      className="quick-links reveal reveal-stagger"
    >
      {items.map((item) => (
        <div className="quick-link-item" key={item.title}>
          <h3>{item.title}</h3>

          <div className="quick-link-img">
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              width={640}
              height={512}
            />
          </div>

          <p>{item.text}</p>

          <Link to={item.link}>
            {item.cta}
          </Link>
        </div>
      ))}
    </section>

  );

}

export default QuickLinks;