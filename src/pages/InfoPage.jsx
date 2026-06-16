import { CheckCircle2 } from "lucide-react";

function InfoPage({ page }) {
  return (
    <section className="page-section info-page">
      <div className="page-heading">
        <span>{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.body}</p>
      </div>
      <div className="info-list">
        {page.details.map((detail) => (
          <article key={detail}>
            <CheckCircle2 size={20} />
            <span>{detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default InfoPage;
