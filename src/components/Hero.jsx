import { ArrowRight, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { storeSpecs } from "../data/storeData";
import voidBox from "../assets/voidbox.png";

const proofIcons = [ShieldCheck, Truck, RotateCcw, PackageCheck];

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

        <div className="void-hero-media is-box" aria-label="VOID premium activewear box">
          <img src={voidBox} alt="VOID premium activewear box" />
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
    </>
  );
}

export default Hero;
