import { storeSpecs } from "../data/storeData";

const defaultWhyItems = [
  {
    title: "Training-first design",
    text: "Built for movement—comfort, support, and performance that lasts through workouts and daily wear.",
  },
  {
    title: "Premium feel & fit",
    text: "T-shirts, shorts, socks, and shakers engineered to feel right from day one.",
  },
  {
    title: "Made for every session",
    text: "From gym days to everyday activity—VOID stays ready for your routine.",
  },
];

function WhyChooseVoid() {
  // Reuse existing “storeSpecs” if present, but keep a consistent 3–4 bullet look.
  const extra = (storeSpecs || []).slice(0, 1).map((s) => ({
    title: s.label,
    text: s.text,
  }));

  const items = [...defaultWhyItems, ...extra].slice(0, 4);

  return (
    <section className="why-void" aria-label="Why choose VOID Activewear">
      <div className="section-heading">
        <span>Why choose VOID ActiveWear</span>
        <h2>Performance essentials, built with intention</h2>
        <a href="#/shop">Shop Core</a>
      </div>

      <div className="why-void-grid">
        {items.map((it) => (
          <article className="why-void-card" key={it.title}>
            <strong>{it.title}</strong>
            <span>{it.text}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default WhyChooseVoid;

