import { useEffect, useMemo, useState } from "react";
import { brandAssets, products, storeSpecs } from "../data/storeData";

function Hero() {
  const heroProducts = useMemo(() => products.slice(0, 4), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProduct = heroProducts[activeIndex % Math.max(heroProducts.length, 1)] || heroProducts[0];

  useEffect(() => {
    if (heroProducts.length < 2) return undefined;

    const id = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % heroProducts.length);
    }, 3200);

    return () => window.clearInterval(id);
  }, [heroProducts.length]);

  return (
    <section className="hero">
      <div className="hero-fade-product" aria-hidden="true" key={`fade-${activeProduct?.name}`}>
        <img src={activeProduct?.gallery?.[0] || brandAssets.heroTee} alt="" />
      </div>

      <div className="hero-copy">
        <span>Built for movement. Designed for stillness.</span>
        <h1>Discipline Over Noise</h1>
        <p>Performance essentials for training, daily movement, and the unseen hours.</p>
        <div className="hero-actions">
          <a className="primary-link" href="#/shop">
            Shop Now
          </a>
          <a className="secondary-link" href="#home-showcase">
            Explore Gear
          </a>
        </div>
        <div className="hero-product-switcher" aria-label="Featured products">
          {heroProducts.map((product, index) => (
            <button
              aria-pressed={index === activeIndex}
              className={index === activeIndex ? "is-active" : ""}
              key={product.name}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img src={product.gallery?.[0] || product.image} alt="" />
              <span>{product.category}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hero-media">
        <img
          key={`hero-${activeProduct?.name}`}
          src={activeProduct?.gallery?.[0] || brandAssets.heroTee}
          alt={activeProduct?.name || "VOID activewear"}
        />
        <div className="hero-product-card">
          <span>{activeProduct?.badge || "VOID"}</span>
          <strong>{activeProduct?.name || "Performance T-Shirt"}</strong>
          <small>{activeProduct?.category || "Training essential"}</small>
        </div>
      </div>

      <div className="hero-strip">
        {storeSpecs.map((spec) => (
          <span key={spec.label}>{spec.label}</span>
        ))}
      </div>
    </section>
  );
}

export default Hero;
