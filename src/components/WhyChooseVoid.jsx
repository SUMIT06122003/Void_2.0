import { Cloud, Crown, MinusCircle, Zap } from "lucide-react";

const items = [
  {
    title: "Built For Performance",
    text: "Engineered to support every move.",
    Icon: Zap
  },
  {
    title: "Minimal. Clean. Timeless.",
    text: "Simple designs that never go out of style.",
    Icon: MinusCircle
  },
  {
    title: "Comfort That Works Hard",
    text: "Premium fabrics for all-day comfort.",
    Icon: Cloud
  },
  {
    title: "Discipline Is Everything",
    text: "More than activewear. It is a mindset.",
    Icon: Crown
  }
];

function WhyChooseVoid() {
  return (
    <section className="void-benefits" aria-label="Why choose VOID Activewear">
      {items.map(({ title, text, Icon }) => (
        <article key={title}>
          <Icon size={34} strokeWidth={1.6} />
          <div>
            <strong>{title}</strong>
            <span>{text}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

export default WhyChooseVoid;
