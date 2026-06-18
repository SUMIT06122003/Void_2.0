import { Facebook, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { brandAssets } from "../data/storeData";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/void.activewear?igsh=MXRjZ2k2ZGcycDQ4cQ==",
    Icon: Instagram
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/61590467143150/",
    Icon: Facebook
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/919892446741",
    Icon: MessageCircle
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/void-activewear/",
    Icon: Linkedin
  }
];

function Footer() {
  return (
    <footer className="void-footer">
      <div className="void-footer-brand">
        <img src={brandAssets.logo} alt="VOID" />
        <p>Premium activewear for the disciplined. Train in purpose. Live in discipline.</p>
        <div className="void-footer-socials" aria-label="Social media links">
          {socialLinks.map(({ label, href, Icon }) => (
            <a href={href} key={label} aria-label={label} target="_blank" rel="noreferrer">
              <Icon size={17} />
            </a>
          ))}
        </div>
      </div>

      <nav aria-label="Footer shop navigation">
        <strong>Shop</strong>
        <a href="#/shop/t-shirt">T-Shirts</a>
        <a href="#/shop/shorts">Shorts</a>
        <a href="#/shop/shaker">Shakers</a>
        <a href="#/shop/socks">Socks</a>
      </nav>

      <nav aria-label="Footer company navigation">
        <strong>Company</strong>
        <a href="#/about">About Us</a>
        <a href="#/reviews">Reviews</a>
        <a href="#/contact">Contact Us</a>
        <a href="#/events">Events</a>
      </nav>

      <nav aria-label="Footer help navigation">
        <strong>Help</strong>
        <a href="#/account/orders">Track Order</a>
        <a href="#/refund-policy">Return Policy</a>
        <a href="#/privacy-policy">Privacy Policy</a>
        <a href="#/terms">Terms Of Service</a>
      </nav>

      <div className="void-footer-news">
        <strong>Stay Updated</strong>
        <form onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="footer-email">
            Email address
          </label>
          <input id="footer-email" type="email" placeholder="Enter your email" />
          <button type="submit" aria-label="Subscribe">
            →
          </button>
        </form>
        <span>New drops. Exclusive offers. No spam, ever.</span>
      </div>

      <div className="void-footer-bottom">
        <span>© 2026 VOID. All rights reserved.</span>
        <span>Designed with purpose.</span>
      </div>
    </footer>
  );
}

export default Footer;
