import styles from "./GlobalMotherContinuityFieldV2.module.css";

const passage = ["Settlement", "Return", "Project formation", "Capacity", "Continuity"] as const;

const domains = [
  { title: "Restoration", detail: "Repair and renewal." },
  { title: "People & community", detail: "Family, education, and humanitarian work." },
  { title: "Institutional capacity", detail: "Infrastructure, technology, and projects." },
  { title: "Culture & heritage", detail: "Memory, creative work, and future generations." },
] as const;

export function GlobalMotherContinuityFieldV2() {
  return (
    <section className={styles.field} aria-label="Article IV restoration and continuity">
      <div className={styles.sequence} aria-label="From settlement to continuity">
        {passage.map((stage, index) => (
          <div key={stage} className={styles.step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stage}</strong>
          </div>
        ))}
      </div>

      <div className={styles.productive}>
        <div className={styles.label}><span>CONT-01</span><span>Productive return</span></div>
        <div className={styles.statement}>
          <h3>Return can build capacity.</h3>
          <p>Lawful trade may support ND Royal Ministry’s restoration and AOTG’s governmental capacity. Agreed return can sustain further work.</p>
        </div>
        <div className={styles.domains}>
          {domains.map(domain => (
            <article key={domain.title}>
              <h4>{domain.title}</h4>
              <p>{domain.detail}</p>
            </article>
          ))}
        </div>
        <p className={styles.boundary}>Allocations, payments, projects, and obligations require their own terms.</p>
      </div>

      <div className={styles.future}>
        <div className={styles.label}><span>CONT-02</span><span>Continuing relationship & future formation</span></div>
        <div className={styles.statement}>
          <h3>Capacity can become continuity.</h3>
          <p>ND Royal Ministry, AOTG, and French-Ward may carry custodial cooperation, culture, and projects beyond any one sale.</p>
        </div>
        <div className={styles.memory}>
          <div>
            <span>Institutional memory</span>
            <strong>Carry the record forward.</strong>
          </div>
          <p>Axis Point may preserve documents, heritage, decisions, and the developing record.</p>
        </div>
      </div>

      <aside className={styles.gift} aria-label="French-Ward inaugural gift intention">
        <div className={styles.giftHeading}>
          <span>French-Ward / Inaugural gift</span>
          <h3>One Gift. Two digital commitments.</h3>
        </div>
        <div className={styles.giftBody}>
          <p>Through Axis Point, French-Ward intends to offer AOTG and ND Royal Ministry a two-part Gift: a digital tokenization pathway and a complete digital media management, design, and development package.</p>
          <p>Each recipient shapes scope and activation. The Gift supports identity, heritage, and communication; it sets no gold-sale term or Royal authority.</p>
        </div>
      </aside>

      <div className={styles.doctrine}>
        <span>Article IV / Governing principle</span>
        <p>Transaction is an event within the relationship. Continuity is what the relationship carries forward.</p>
      </div>
    </section>
  );
}
