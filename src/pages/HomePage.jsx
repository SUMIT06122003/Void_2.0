import { useEffect, useMemo, useState } from "react";
import Hero from "../components/Hero";
import Testimonials from "../components/Testimonials";
import WhyChooseVoid from "../components/WhyChooseVoid";
import { products as fallbackProducts, testimonials } from "../data/storeData";

function HomePage({ products = fallbackProducts }) {
  return (
    <>
      <Hero />
      <HomeStats />
      <WhyChooseVoid />
      <ProductVisualsAndBenefits products={products} />
      <HomeReviewSpotlight />
      <Testimonials />
    </>
  );
}

function HomeStats() {
  const stats = [
    { value: "4", label: "Core drops" },
    { value: "24/7", label: "Daily wear ready" },
    { value: "4.5+", label: "Customer rating" },
  ];

  return (
    <section className="home-stats" aria-label="VOID store highlights">
      {stats.map((stat) => (
        <article key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </article>
      ))}
      <a href="#/shop">Build your kit</a>
    </section>
  );
}

function HomeReviewSpotlight() {
  const featuredReview = testimonials[0];
  const supportingReviews = testimonials.slice(1, 4);

  return (
    <section className="home-review-spotlight">
      <div className="review-spotlight-video">
        <video src={featuredReview.video} controls playsInline preload="metadata" />
      </div>
      <div className="review-spotlight-copy">
        <span>Review Videos</span>
        <h2>See the kit moving before you buy.</h2>
        <p>Real customer videos from the VOID asset library, shown right inside the storefront.</p>
        <div className="review-spotlight-list">
          {supportingReviews.map((review) => (
            <article key={review.video}>
              <video src={review.video} muted playsInline preload="metadata" />
              <div>
                <strong>{review.name}</strong>
                <span>{review.detail}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
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
        <h2>Tap through the VOID training kit</h2>
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
                    <p className="home-benefit-sub">Performance you can feel, built for training and daily wear.</p>

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
