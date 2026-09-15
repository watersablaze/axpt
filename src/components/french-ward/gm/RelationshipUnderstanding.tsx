import styles from "./RelationshipUnderstanding.module.css";

const items = [
  {
    label: "Established",
    title: "Royal standing",
    body:
      "Sufficient preliminary confirmation has been undertaken for the Great Mother’s Royal standing to be received in good faith.",
    state: "CONFIRMED",
  },
  {
    label: "Offered",
    title: "A relational economic opening",
    body:
      "The invitation joins family relationship, lawful trade, restoration, project advancement and continuing return.",
    state: "UNDERSTOOD",
  },
  {
    label: "Understood",
    title: "More than a commodity transaction",
    body:
      "Gold is understood as an initiating economic corridor within a larger relationship, not the final purpose of the relationship itself.",
    state: "UNDERSTOOD",
  },
  {
    label: "To be defined",
    title: "Institutional authority",
    body:
      "The precise custodial appointment, reserved Royal powers and authorities required for implementation remain to be formally established.",
    state: "OPEN",
  },
];

export function RelationshipUnderstanding() {
  return (
    <section className={styles.section} aria-labelledby="understanding-heading">
      <header>
        <p>Structured understanding</p>
        <h3 id="understanding-heading">
          What is already known should not be confused with what remains open.
        </h3>
      </header>

      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.label}>
            <div className={styles.topline}>
              <span>{item.label}</span>
              <strong>{item.state}</strong>
            </div>
            <h4>{item.title}</h4>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
