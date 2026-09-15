import styles from "./InstrumentStatusRail.module.css";

const stages = [
  "Presented",
  "Received",
  "Deliberation",
  "Alignment",
  "Definitive Instrument",
];

export function InstrumentStatusRail() {
  return (
    <section className={styles.rail} aria-label="Instrument progression">
      <div className={styles.label}>Instrument progression</div>

      <ol>
        {stages.map((stage, index) => (
          <li
            key={stage}
            className={index === 2 ? styles.current : undefined}
            aria-current={index === 2 ? "step" : undefined}
          >
            <span className={styles.index}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{stage}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
