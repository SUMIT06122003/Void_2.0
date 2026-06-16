import { testimonials } from "../data/storeData";
import { pauseOtherVideos } from "../utils/videoPlayback";

function Testimonials() {
  return (
    <section className="reviews-section" aria-label="Customer video reviews">
      <div className="section-heading">
        <span>Customer Reviews</span>
        <h2>Real movement. Real VOID feedback.</h2>
      </div>
      <div className="review-grid">
        {testimonials.map((review) => (
          <article className="review-card" key={review.video}>
            <video src={review.video} controls playsInline preload="metadata" onPlay={pauseOtherVideos} />
            <div>
              <strong>{review.name}</strong>
              <span>{review.detail}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
