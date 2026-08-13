import { Navbar, Masthead } from "../components/Header";
import Hero from "../components/Hero";
import NewsSidebar from "../components/NewsSidebar";
import BestSeller from "../components/BestSeller";
import Promise from "../components/Promise";
import NewArrivals from "../components/NewArrivals";
import QuickLinks from "../components/QuickLinks";
import Footer from "../components/Footer";
import useScrollReveal from "../hooks/useScrollReveal";

function Home() {
  const bestsellerReveal = useScrollReveal();
  const arrivalsReveal   = useScrollReveal();
  const promiseReveal    = useScrollReveal();

  return (
    <>
      <Navbar />
      <div className="paper-sheet paper-grain">
        <Masthead />
        <div className="hero-news-wrapper">
          <Hero />
          <NewsSidebar />
        </div>
        <QuickLinks />
        <div ref={bestsellerReveal} className="reveal"><BestSeller /></div>
        <div ref={arrivalsReveal} className="reveal"><NewArrivals /></div>
        <div ref={promiseReveal} className="reveal"><Promise /></div>
      </div>
      <Footer />
    </>
  );
}

export default Home;