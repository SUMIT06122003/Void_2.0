import { useEffect, useMemo, useState } from "react";
import Hero from "../components/Hero";
import Testimonials from "../components/Testimonials";
import WhyChooseVoid from "../components/WhyChooseVoid";
import { products as fallbackProducts } from "../data/storeData";

function HomePage({ products = fallbackProducts }) {
  return (
    <>
      <Hero />
      <HomeExperienceBand />
      <WhyChooseVoid />
      <ProductVisualsAndBenefits products={products} />
      <Testimonials />
    </>
  );
}

function HomeExperienceBand() {
  const items = [
    {
      kicker: "Fit",
      title: "Made to move clean",
      text: "Cuts, hems, and stretch points are chosen for training range without looking loud."
    },
    {
      kicker: "Feel",
      title: "Soft where it matters",
      text: "Every core piece is selected to feel easy during warmups, commutes, and long wear."
    },
    {
      kicker: "Flow",
      title: "Fast buying, clear tracking",
      text: "Saved addresses, order status, and account tools stay close after checkout."
    }
  ];

  return (
    <section className="home-experience-band" aria-label="VOID shopping experience">
      {items.map((item) => (
        <article key={item.title}>
          <span>{item.kicker}</span>
          <strong>{item.title}</strong>
          <p>{item.text}</p>
        </article>
      ))}
    </section>
  );
}

function ProductVisualsAndBenefits({ products: sectionProducts }) {
  const slides = useMemo(() => sectionProducts ?? [], [sectionProducts]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProduct = slides[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  const goToSlide = (direction) => {
    if (!slides.length) return;

    setActiveIndex((current) => {
      const nextIndex = current + direction;
      if (nextIndex < 0) return slides.length - 1;
      if (nextIndex >= slides.length) return 0;
      return nextIndex;
    });
  };

  return (
    <section className="products-section home-visual-benefits" id="home-showcase">
      <div className="section-heading">
        <span>Built for movement. Designed for stillness.</span>
        <h2>Stay inside the kit before you buy</h2>
        <a href="#/shop">View All</a>
      </div>

      <div className="visual-benefits-shell">
        <div className="visual-benefits-slider" aria-label="Product visuals and benefits">
          <div
            className="visual-benefits-track"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((product, index) => {
              const benefitList = (product.specs || []).slice(0, 3);
              const isActive = index === activeIndex;

              return (
                <article
                  aria-hidden={!isActive}
                  className={["visual-benefits-slide", isActive ? "is-active" : ""].join(" ")}
                  key={product.name}
                >
                  <div className="visual-benefits-media">
                    <img src={product.gallery?.[0] || product.image} alt={product.name} />
                    <span>{product.badge}</span>
                  </div>

                  <div className="visual-benefits-copy">
                    <span>{product.category}</span>
                    <h3>{product.name}</h3>
                    <p className="home-benefit-sub">Inspect the fit, details, price, and training use before you move to checkout.</p>

                    {benefitList.length ? (
                      <ul className="home-benefit-list">
                        {benefitList.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="home-benefit-meta">
                      <strong>{product.price}</strong>
                      <span>{product.rating} rating</span>
                    </div>

                    <div className="home-benefit-cta">
                      <a className="primary-link dark-link" href="#/shop">
                        Shop Now
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="visual-benefits-controls" aria-label="Product carousel controls">
          <button onClick={() => goToSlide(-1)} type="button" aria-label="Previous product">
            Prev
          </button>
          <div className="visual-benefits-dots">
            {slides.map((product, index) => (
              <button
                aria-label={`Show ${product.name}`}
                aria-pressed={index === activeIndex}
                className={index === activeIndex ? "is-active" : ""}
                key={product.name}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
          <button onClick={() => goToSlide(1)} type="button" aria-label="Next product">
            Next
          </button>
        </div>

        {activeProduct ? (
          <div className="visual-benefits-thumbs" aria-label="Product quick select">
            {slides.map((product, index) => (
              <button
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
        ) : null}
      </div>
    </section>
  );
}

export default HomePage;
