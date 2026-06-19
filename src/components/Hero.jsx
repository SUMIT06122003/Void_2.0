import { ArrowRight } from "lucide-react";
import voidBox from "../assets/voidbox.png";

function Hero() {
  return (
    <>
      <section className="void-hero">
        <div className="void-hero-copy">
          <span>Premium Activewear</span>
          <h1>Built For Discipline. Made To Last.</h1>
          <p>Premium activewear engineered for movement.</p>
          <a className="void-button" href="#/shop">
            Shop Collection <ArrowRight size={16} />
          </a>
        </div>

        <div className="void-hero-sticky-stage">
          <div className="void-hero-media is-box" aria-label="VOID premium activewear box">
            <img src={voidBox} alt="VOID premium activewear box" />
          </div>
        </div>

      </section>
    </>
  );
}

export default Hero;
