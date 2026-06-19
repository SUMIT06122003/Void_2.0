import { ArrowRight, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { storeSpecs } from "../data/storeData";
import voidBox from "../assets/voidbox.png";

const proofIcons = [ShieldCheck, Truck, RotateCcw, PackageCheck];

function Hero() {
  return (
    <section className="void-hero">
      <div className="void-hero-copy">
        <span>Premium Activewear</span>
        <h1>Built For Discipline. Made To Last.</h1>
        <p>Performance-driven essentials for those who show up every day.</p>
        <a className="void-button" href="#/shop">
          Shop Now <ArrowRight size={16} />
        </a>
      </div>

      <div className="void-hero-media" aria-label="VOID activewear hero">
        <img src={voidBox} alt="VOID activewear gift box" />
        <div className="void-hero-signature" aria-hidden="true">
          <i />
          <span>Fueling Ambition</span>
          <i />
        </div>
      </div>

      <div className="void-proof-row" aria-label="Store benefits">
        {storeSpecs.map((spec, index) => {
          const Icon = proofIcons[index % proofIcons.length];
          return (
            <article key={spec.label}>
              <Icon size={22} />
              <div>
                <strong>{spec.label}</strong>
                <span>{spec.text}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Hero;
