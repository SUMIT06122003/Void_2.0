import { products, testimonials } from "../data/storeData";
import { pauseOtherVideos } from "../utils/videoPlayback";

function AboutPage() {
  const heroProducts = products.slice(0, 3);
  const review = testimonials[0];

  return (
    <section className="page-section about-page">
      <div className="about-hero">
        <div>
          <span>About VOID</span>
          <h1>Discipline Over Noise</h1>
          <p>
            VOID Activewear builds T-shirts, shorts, socks, and shakers for people
            who choose fitness as a daily habit.
          </p>
          <a className="primary-link dark-link" href="#/shop">
            Shop Core
          </a>
        </div>
        <div className="about-hero-media">
          {heroProducts.map((product) => (
            <img src={product.gallery?.[0] || product.image} alt={product.name} key={product.name} />
          ))}
        </div>
      </div>
      <div className="about-story-grid">
        <article>
          <span>Materials</span>
          <strong>Training fit, daily comfort, minimal branding.</strong>
        </article>
        <article>
          <span>Flow</span>
          <strong>From workout bag to streetwear without changing rhythm.</strong>
        </article>
        <article>
          <span>Proof</span>
          <strong>Customer review videos stay visible before checkout.</strong>
        </article>
      </div>
      <div className="about-review-video">
        <video src={review.video} controls playsInline preload="metadata" onPlay={pauseOtherVideos} />
        <div>
          <span>{review.name}</span>
          <h2>Real movement feedback</h2>
          <p>{review.detail}</p>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;
