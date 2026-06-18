import {
  ArrowRight,
  Crown,
  Dumbbell,
  ShieldCheck
} from "lucide-react";
import Hero from "../components/Hero";
import Testimonials from "../components/Testimonials";
import WhyChooseVoid from "../components/WhyChooseVoid";
import { brandAssets, products as fallbackProducts, storeSpecs } from "../data/storeData";
import { categoryToSlug, productToSlug } from "../utils/catalog";

function HomePage({ products = fallbackProducts }) {
  const displayProducts = products.length ? products : fallbackProducts;
  const categories = buildCategories(displayProducts);
  const featured = displayProducts.slice(0, 4);
  const aboutImage = displayProducts[0]?.gallery?.[4] || displayProducts[0]?.image || brandAssets.heroTee;

  return (
    <>
      <Hero />
      <CategoryShowcase categories={categories} />
      <WhyChooseVoid />
      <CoreCollection products={featured} />
      <AboutVoid image={aboutImage} />
      <Testimonials />
      <StoreSpecsStrip />
      <CommunitySignup />
    </>
  );
}

function CategoryShowcase({ categories }) {
  return (
    <section className="void-section void-categories" aria-label="Shop by category">
      <div className="void-section-heading is-centered">
        <span>Explore Our Essentials</span>
        <h2>Designed For Every Move</h2>
      </div>
      <div className="void-category-grid">
        {categories.map((category) => (
          <a className="void-category-card" href={`#/shop/${category.slug}`} key={category.name}>
            <img src={category.image} alt={category.name} />
            <div>
              <strong>{category.name}</strong>
              <span>
                Shop Now <ArrowRight size={14} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function CoreCollection({ products }) {
  return (
    <section className="void-section void-core" aria-label="Core collection">
      <div className="void-core-intro">
        <span>New Drop</span>
        <h2>Core Collection</h2>
        <p>Minimal pieces. Maximum impact. Made to push your limits.</p>
        <a className="void-button" href="#/shop">
          View Collection <ArrowRight size={16} />
        </a>
      </div>
      <div className="void-product-row">
        {products.map((product, index) => (
          <article className="void-product-card" key={product.name}>
            {index === 0 ? <span className="void-product-badge">Best Seller</span> : null}
            <a className="void-product-image" href={`#/product/${productToSlug(product)}`}>
              <img src={product.image} alt={product.name} />
            </a>
            <div className="void-product-copy">
              <h3>
                <a href={`#/product/${productToSlug(product)}`}>{product.name}</a>
              </h3>
              <strong>{product.price}</strong>
              <span className="void-rating">Rated {product.rating || "4.50"} ({index === 0 ? "120" : 38 + index * 18})</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutVoid({ image }) {
  return (
    <section className="void-section void-about" aria-label="About VOID">
      <div className="void-about-media">
        <img src={image} alt="VOID performance product detail" />
      </div>
      <div className="void-about-copy">
        <span>About VOID</span>
        <h2>More Than A Brand. A Standard.</h2>
        <p>
          VOID is built for the ones who choose discipline over motivation. We design premium
          activewear that blends performance, comfort, and minimal aesthetics.
        </p>
        <div className="void-about-points">
          <article>
            <ShieldCheck size={22} />
            <strong>Quality You Can Feel</strong>
            <span>Premium fabrics. Built to last.</span>
          </article>
          <article>
            <Dumbbell size={22} />
            <strong>Designed In India</strong>
            <span>Thoughtfully designed. Responsibly made.</span>
          </article>
          <article>
            <Crown size={22} />
            <strong>For The Disciplined</strong>
            <span>For those who stay consistent.</span>
          </article>
        </div>
        <a className="void-button" href="#/about">
          Learn More <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}

function StoreSpecsStrip() {
  return (
    <section className="void-store-strip" aria-label="Store promises">
      {storeSpecs.map((spec) => (
        <article key={spec.label}>
          <ShieldCheck size={20} />
          <strong>{spec.label}</strong>
          <span>{spec.text}</span>
        </article>
      ))}
    </section>
  );
}

function CommunitySignup() {
  const handleSubmit = (event) => {
    event.preventDefault();
    const mobile = new FormData(event.currentTarget).get("mobile")?.toString().trim();
    window.location.hash = mobile ? `#/register?mobile=${encodeURIComponent(mobile)}` : "#/register";
  };

  return (
    <section className="void-community" aria-label="Join the VOID community">
      <div>
        <h2>Join The VOID Community</h2>
        <p>Get early access to new drops, exclusive offers and fitness insights.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="void-community-mobile">
          Mobile number
        </label>
        <input
          id="void-community-mobile"
          name="mobile"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Enter your mobile number"
        />
        <button type="submit">Join Now</button>
      </form>
    </section>
  );
}

function buildCategories(products) {
  const map = new Map();

  for (const product of products) {
    if (!product.category || map.has(product.category)) continue;
    map.set(product.category, {
      name: pluralizeCategory(product.category),
      slug: categoryToSlug(product.category),
      image: product.gallery?.[0] || product.image
    });
  }

  return Array.from(map.values());
}

function pluralizeCategory(category) {
  if (category === "T-Shirt") return "T-Shirts";
  if (category === "Shaker") return "Shakers";
  return category;
}

export default HomePage;
