import { Move, Shirt, Wind, Zap } from "lucide-react";

const items = [
  {
    title: "Quick Dry",
    text: "Sweat-wicking fabric keeps you ready.",
    Icon: Zap
  },
  {
    title: "4-Way Stretch",
    text: "Freedom through every rep and stride.",
    Icon: Move
  },
  {
    title: "Breathable",
    text: "Built for airflow and all-day comfort.",
    Icon: Wind
  },
  {
    title: "Performance Fit",
    text: "A clean athletic cut that moves with you.",
    Icon: Shirt
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
