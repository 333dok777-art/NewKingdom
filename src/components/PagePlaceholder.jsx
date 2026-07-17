export default function PagePlaceholder({ title, description, eyebrow = 'NewKingdom' }) {
  return (
    <section className="placeholder" aria-labelledby="page-title">
      <p className="placeholder__eyebrow">{eyebrow}</p>
      <h1 id="page-title">{title}</h1>
      <p>{description}</p>
    </section>
  )
}
