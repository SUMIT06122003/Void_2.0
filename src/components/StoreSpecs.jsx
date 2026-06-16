import { storeSpecs } from "../data/storeData";

function StoreSpecs() {
  return (
    <section className="store-specs" aria-label="Store benefits">
      {storeSpecs.map((spec) => (
        <article key={spec.label}>
          <strong>{spec.label}</strong>
          <span>{spec.text}</span>
        </article>
      ))}
    </section>
  );
}

export default StoreSpecs;
