import useDept from "../hooks/useDept";
import useScrollReveal from "../hooks/useScrollReveal";
import { Link } from "react-router-dom";

const CrownIcon = () => (
<svg
viewBox="0 0 24 24"
width="26"
height="26"
fill="currentColor"
aria-hidden="true"

>

```
<path d="M3 8l4 4 5-7 5 7 4-4-2 10H5L3 8z" />
```

  </svg>
);

const HeartIcon = () => (
<svg
viewBox="0 0 24 24"
width="26"
height="26"
fill="none"
stroke="currentColor"
strokeWidth="1.6"
aria-hidden="true"

>

```
<path d="M12 20s-7-4.4-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.6-7 9-7 9z" />
```

  </svg>
);

const LockIcon = () => (
<svg
viewBox="0 0 24 24"
width="26"
height="26"
fill="none"
stroke="currentColor"
strokeWidth="1.6"
aria-hidden="true"

>

```
<rect x="5" y="10" width="14" height="10" rx="1.5" />
```

```
<path d="M8.5 10V7.5a3.5 3.5 0 017 0V10" />
```

  </svg>
);

const ITEMS = [
{
icon: <CrownIcon />,
title: "PREMIUM QUALITY",
text: "Finest fabrics, perfect finish, every single time.",
},
{
icon: <HeartIcon />,
title: "MADE FOR YOU",
text: "Designed to empower every woman who wears it.",
},
{
icon: <LockIcon />,
title: "EXCLUSIVE DESIGNS",
text: "Unique. Limited. Unapologetically delulu.",
},
];

function Promise({ heading = "OUR PROMISE", items = ITEMS }) {
const dept = useDept();

useScrollReveal();

return (
    <section className="promise-band"> <h2>{heading}</h2>


    <div className="promise-band-grid">
      {items.map((item) => (
        <div className="promise-band-cell" key={item.title}>
          {item.icon}

          <strong>{item.title}</strong>

          <span>{item.text}</span>
        </div>
      ))}
    </div>
  </section>



);
}

export default Promise;


