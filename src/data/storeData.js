import {
  Bell,
  Home,
  LogOut,
  MapPin,
  Package,
  User
} from "lucide-react";
import logo from "../../assets/logo's/void logo font.png";
import heroTee from "../../assets/tshirts/tshirt B1.jpg";
import teeFront from "../../assets/tshirts/tshirt B1.jpg";
import teeProduct from "../../assets/tshirts/tshirt G1.jpg";
import teeMock from "../../assets/tshirts/tshirt mock.png";
import teeOne from "../../assets/tshirts/1.png";
import teeDesign from "../../assets/tshirts/Untitled design (39).png";
import shortHero from "../../assets/shorts/3.png";
import shortProduct from "../../assets/shorts/Untitled (1200 x 1500 px) (12).jpg";
import shortTwo from "../../assets/shorts/Untitled (1200 x 1500 px) (13).jpg";
import shortThree from "../../assets/shorts/Untitled (1200 x 1500 px) (14).jpg";
import shortFour from "../../assets/shorts/Untitled (1200 x 1500 px) (15).jpg";
import socksHero from "../../assets/socks colours/1.png";
import socksProduct from "../../assets/socks colours/socks colours (1).jpg";
import socksTwo from "../../assets/socks colours/socks colours (3).jpg";
import socksThree from "../../assets/socks colours/socks colours (6).jpg";
import socksFour from "../../assets/socks colours/socks colours (10).jpg";
import socksFive from "../../assets/socks colours/socks colours (12).jpg";
import shakerProduct from "../../assets/shakers/shaker B1.jpg";
import shakerTwo from "../../assets/shakers/shaker B2.jpg";
import shakerThree from "../../assets/shakers/shaker N1.jpg";
import shakerFour from "../../assets/shakers/shaker N2.jpg";
import shakerFive from "../../assets/shakers/Untitled (1200 x 1500 px) (2).jpg";
import reviewOne from "../../assets/testimonials/WhatsApp Video 2026-05-02 at 17.46.11.mp4";
import reviewTwo from "../../assets/testimonials/WhatsApp Video 2026-05-02 at 17.47.40 (1).mp4";
import reviewThree from "../../assets/testimonials/WhatsApp Video 2026-05-02 at 17.47.40 (2).mp4";
import reviewFour from "../../assets/testimonials/WhatsApp Video 2026-05-02 at 17.47.40.mp4";
import { cloudinaryImage, cloudinaryVideo } from "../utils/cloudinary";

export const brandAssets = {
  logo: cloudinaryImage("brand/void-logo-font.png", logo),
  heroTee: cloudinaryImage("products/tshirts/hero-tee.jpg", heroTee)
};

const media = {
  teeFront: cloudinaryImage("products/tshirts/tee-front.jpg", teeFront),
  teeProduct: cloudinaryImage("products/tshirts/performance-tshirt-main.jpg", teeProduct),
  teeMock: cloudinaryImage("products/tshirts/tshirt-mock.png", teeMock),
  teeOne: cloudinaryImage("products/tshirts/tshirt-one.png", teeOne),
  teeDesign: cloudinaryImage("products/tshirts/tee-design.png", teeDesign),
  shortHero: cloudinaryImage("products/shorts/shorts-hero.png", shortHero),
  shortProduct: cloudinaryImage("products/shorts/performance-shorts-main.jpg", shortProduct),
  shortTwo: cloudinaryImage("products/shorts/performance-shorts-two.jpg", shortTwo),
  shortThree: cloudinaryImage("products/shorts/performance-shorts-three.jpg", shortThree),
  shortFour: cloudinaryImage("products/shorts/performance-shorts-four.jpg", shortFour),
  socksHero: cloudinaryImage("products/socks/socks-hero.png", socksHero),
  socksProduct: cloudinaryImage("products/socks/anti-odour-socks-main.jpg", socksProduct),
  socksTwo: cloudinaryImage("products/socks/anti-odour-socks-two.jpg", socksTwo),
  socksThree: cloudinaryImage("products/socks/anti-odour-socks-three.jpg", socksThree),
  socksFour: cloudinaryImage("products/socks/anti-odour-socks-four.jpg", socksFour),
  socksFive: cloudinaryImage("products/socks/anti-odour-socks-five.jpg", socksFive),
  shakerProduct: cloudinaryImage("products/shakers/crystal-shaker-main.jpg", shakerProduct),
  shakerTwo: cloudinaryImage("products/shakers/crystal-shaker-two.jpg", shakerTwo),
  shakerThree: cloudinaryImage("products/shakers/crystal-shaker-three.jpg", shakerThree),
  shakerFour: cloudinaryImage("products/shakers/crystal-shaker-four.jpg", shakerFour),
  shakerFive: cloudinaryImage("products/shakers/crystal-shaker-five.jpg", shakerFive),
  reviewOne: cloudinaryVideo("testimonials/void-athlete-review.mp4", reviewOne),
  reviewTwo: cloudinaryVideo("testimonials/training-fit-check.mp4", reviewTwo),
  reviewThree: cloudinaryVideo("testimonials/customer-movement-review.mp4", reviewThree),
  reviewFour: cloudinaryVideo("testimonials/activewear-feedback.mp4", reviewFour)
};

export const routes = [
  { label: "Home", path: "/" },
  { label: "Shop", path: "/shop" },
  { label: "Events", path: "/events" },
  { label: "Blog", path: "/blog" }
];

export const utilityRoutes = [
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Refund Policy", path: "/refund-policy" },
  { label: "Register", path: "/register" }
];

export const policyPages = {
  "/blog": {
    eyebrow: "Blog",
    title: "VOID Journal",
    body: "Product stories, training notes, launch updates, and activewear guides from VOID.",
    details: ["Training and fit guides", "Product launch notes", "Brand updates"]
  },
  "/contact": {
    eyebrow: "Contact Us",
    title: "We Are Here For You",
    body: "For orders, shipping, returns, or product help, reach VOID support directly.",
    details: ["voidactivewear@gmail.com", "+91 77188 89088", "Support hours: Monday to Saturday"]
  },
  "/privacy-policy": {
    eyebrow: "Privacy Policy",
    title: "Your Details Stay Protected",
    body: "We use account, order, and contact details only to process purchases, support customers, and improve the VOID store experience.",
    details: ["Secure checkout", "Account data protection", "Customer support records"]
  },
  "/refund-policy": {
    eyebrow: "Refund Policy",
    title: "Returns And Refunds",
    body: "VOID keeps returns simple: track requests from your account, follow support instructions, and monitor refund status from the dashboard.",
    details: ["Easy returns", "Refund tracking", "Order-linked support"]
  },
  "/terms": {
    eyebrow: "Terms And Conditions",
    title: "Store Terms",
    body: "Orders, payments, returns, and account access are handled under VOID Activewear store policies.",
    details: ["Secure payments", "Order confirmation", "Customer responsibility"]
  }
};

export const storeSpecs = [
  { label: "Free Shipping", text: "Available on eligible VOID orders." },
  { label: "Secure Payments", text: "Protected checkout for every purchase." },
  { label: "Easy Returns", text: "Return support from your account dashboard." },
  { label: "Order Tracking", text: "Track processing, shipped, and delivered orders." }
];

export const accountItems = [
  { label: "Dashboard", icon: Home },
  { label: "Profile", icon: User, children: ["Saved Details", "Reward Points"] },
  { label: "Order Status", icon: Package },
  { label: "Add Address", icon: MapPin },
  { label: "Returns & Refunds", icon: Package },
  { label: "Coupons & Rewards", icon: Bell },
  { label: "Logout", icon: LogOut }
];

export const products = [
  {
    name: "Performance T-Shirt",
    category: "T-Shirt",
    price: "Rs. 1,299",
    compareAt: "Rs. 1,899",
    image: media.teeProduct,
    gallery: [media.teeProduct, media.teeFront, media.teeMock, media.teeOne, media.teeDesign],
    badge: "Sale",
    rating: "4.50",
    variants: {
      color: ["Cosmic Black", "Lunar Grey"],
      size: ["S", "M", "L", "XL"]
    },
    specs: ["Training fit", "Daily comfort", "Minimal VOID branding"]
  },
  {
    name: "Performance Shorts",
    category: "Shorts",
    price: "Rs. 1,299",
    compareAt: "Rs. 2,049",
    image: media.shortProduct,
    gallery: [media.shortProduct, media.shortTwo, media.shortThree, media.shortFour, media.shortHero],
    badge: "Sale",
    rating: "4.50",
    variants: {
      color: ["Black Green", "Black Orange", "Navy Blue Green", "Navy Blue Orange"],
      size: ["S", "M", "L"]
    },
    specs: ["Training ready", "Secure pockets", "Lightweight movement"]
  },
  {
    name: "Anti-Odour Socks",
    category: "Socks",
    price: "Rs. 449 - Rs. 599",
    compareAt: "Rs. 599 - Rs. 749",
    image: media.socksProduct,
    gallery: [media.socksProduct, media.socksTwo, media.socksThree, media.socksFour, media.socksFive, media.socksHero],
    badge: "2 Pack",
    rating: "4.50",
    variants: {
      color: ["Absolute Black", "Ash Grey", "Midnight Blue"]
    },
    specs: ["Anti-odour knit", "Ribbed support", "Everyday training"]
  },
  {
    name: "Crystal Shaker",
    category: "Shaker",
    price: "Rs. 549",
    compareAt: "Rs. 749",
    image: media.shakerProduct,
    gallery: [media.shakerProduct, media.shakerTwo, media.shakerThree, media.shakerFour, media.shakerFive],
    badge: "Sale",
    rating: "5.00",
    variants: {
      color: ["Charcoal Black", "Glacier Blue"]
    },
    specs: ["Gym shaker", "Carry loop lid", "VOID vertical mark"]
  }
];

export const testimonials = [
  { name: "VOID Athlete Review", detail: "Performance T-Shirt", video: media.reviewOne },
  { name: "Training Fit Check", detail: "Shorts and daily gym wear", video: media.reviewTwo },
  { name: "Customer Movement Review", detail: "VOID core comfort", video: media.reviewThree },
  { name: "Activewear Feedback", detail: "Fit, feel, and finish", video: media.reviewFour }
];
