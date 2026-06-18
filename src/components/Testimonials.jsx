import { testimonials } from "../data/storeData";
import { pauseOtherVideos } from "../utils/videoPlayback";

const quotes = [
  "\"The fabric quality is insane. Fits perfectly and feels premium.\"",
  "\"Finally a brand in India that gets minimal and performance right.\"",
  "\"Wore it for a workout and for a casual day out. 10/10.\"",
  "\"VOID is now my go-to for all gym essentials. Highly recommended.\""
];

function Testimonials() {
  return (
    <section className="void-section void-reviews" aria-label="Customer video reviews">
      <div className="void-section-heading is-centered">
        <h2>Real People. Real Results.</h2>
      </div>
      <div className="void-review-row">
        {testimonials.map((review, index) => (
          <article className="void-review-card" key={review.video}>
            <video src={review.video} controls playsInline preload="metadata" onPlay={pauseOtherVideos} />
            <p>{quotes[index % quotes.length]}</p>
            <strong>- {review.name.replace("VOID ", "")}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
