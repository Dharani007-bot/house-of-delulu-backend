function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <h2>HOUSE OF DELULU</h2>
          <p>Confidence. Style. DELULU.</p>
        </div>
        <div className="footer-socials">
          <a href="#">Instagram</a>
          <a href="#">TikTok</a>
          <a href="#">Pinterest</a>
        </div>
      </div>

      <div className="footer-grid">
        <div>
          <h3>Shop</h3>
          <a href="#">New Arrivals</a>
          <a href="#">Best Sellers</a>
          <a href="#">T-Shirts</a>
          <a href="#">Shirts</a>
        </div>

        <div>
          <h3>Customer Care</h3>
          <a href="#">Shipping Info</a>
          <a href="#">Returns</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>

        <div>
          <h3>Newsletter</h3>
          <p>Get early access to new drops and exclusive offers.</p>
          <br />
          <input type="email" placeholder="YOUR EMAIL ADDRESS" />
          <button className="footer-subscribe-btn">SUBSCRIBE</button>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">© 2026 HOUSE OF DELULU. ALL RIGHTS RESERVED.</p>
        <p className="footer-tagline">THANK YOU FOR SUPPORTING A BRAND THAT EMPOWERS MEN.</p>
      </div>
    </footer>
  );
}



export default Footer;

