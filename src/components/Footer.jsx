import { Facebook, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { brandAssets } from "../data/storeData";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/void.activewear?igsh=MXRjZ2k2ZGcycDQ4cQ==",
    className: "is-instagram",
    Icon: Instagram
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/61590467143150/",
    className: "is-facebook",
    Icon: Facebook
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/919892446741",
    className: "is-whatsapp",
    Icon: MessageCircle
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/void-activewear/",
    className: "is-linkedin",
    Icon: Linkedin
  }
];

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <img src={brandAssets.logo} alt="VOID" />
        <p>VOID Activewear. Fueling ambition through everyday performance essentials.</p>
      </div>
      <nav aria-label="Footer navigation">
        <strong>Explore</strong>
        <a href="#/shop">Shop</a>
        <a href="#/account/orders">My Orders</a>
        <a href="#/privacy-policy">Privacy Policy</a>
        <a href="#/refund-policy">Refund Policy</a>
        <a href="#/terms">Terms & Conditions</a>
      </nav>
      <div className="footer-contact">
        <strong>Contact</strong>
        <span>voidactivewear@gmail.com</span>
        <span>+91 77188 89088</span>
        <div className="footer-socials" aria-label="Social media links">
          {socialLinks.map(({ label, href, className, Icon }) => (
            <a className={className} href={href} key={label} aria-label={label} target="_blank" rel="noreferrer">
              <Icon size={18} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
