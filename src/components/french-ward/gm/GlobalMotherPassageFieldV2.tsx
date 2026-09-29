import styles from "./GlobalMotherPassageFieldV2.module.css";

const stages = [
  { number: "01", title: "Source", condition: "Identify the gold, its source, and presenting party." },
  { number: "02", title: "Authority", condition: "Evidence authority for sale and passage." },
  { number: "03", title: "Verification", condition: "Establish provenance, product evidence, and inspection or assay." },
  { number: "04", title: "Readiness", condition: "Resolve documents, export, logistics, and approvals." },
  { number: "05", title: "Receiving Gateway", condition: "Establish French-Ward’s refinery relationship and receiving capacity." },
  { number: "06", title: "Validation", condition: "Apply agreed receiving inspection, assay, or validation." },
  { number: "07", title: "Settlement", condition: "Perform payment and release under the definitive instrument." },
  { number: "08", title: "Return", condition: "Account for agreed value and capacity commitments to ND Royal Ministry and AOTG." },
] as const;

export function GlobalMotherPassageFieldV2() {
  return (
    <section className={styles.field} aria-label="Article III gold passage">
      <div className={styles.opening}>
        <span>PASS-01 / Governed passage</span>
        <p>Eight conditions govern movement from source to return.</p>
      </div>

      <div className={styles.sequence} aria-label="Eight stages of gold passage">
        {stages.map(stage => (
          <article key={stage.number} className={styles.stage}>
            <span className={styles.stageNumber}>{stage.number}</span>
            <h3>{stage.title}</h3>
            <p>{stage.condition}</p>
          </article>
        ))}
      </div>

      <div className={styles.corridor}>
        <div className={styles.label}><span>PASS-02</span><span>Present gold corridor</span></div>
        <div className={styles.corridorBody}>
          <h3>Form the transaction around verified capacity.</h3>
          <p>Establish French-Ward’s refinery relationship; confirm buyer, refinery, and counterparty capacity; assemble product evidence, logistics, settlement, and definitive documents.</p>
        </div>
        <p className={styles.boundary}>Quantity, price, discounts, payment, delivery, refinery terms, commissions, contributions, and allocations belong in commercial instruments. Article IV’s digital Gift is a distinct intention.</p>
      </div>

      <div className={styles.movement}>
        <div className={styles.label}><span>PASS-03</span><span>Readiness & movement</span></div>
        <h3>Name the condition. Assign the next act.</h3>
        <p>Record the current and next stage, open condition, responsible party, and required evidence. Advance when conditions converge.</p>
        <div className={styles.record} aria-label="Fields to record in an active dossier">
          <span>Current stage</span><span>Next stage</span><span>Open condition</span><span>Responsible party</span><span>Required evidence</span>
        </div>
      </div>

      <div className={styles.doctrine}>
        <span>Article III / Governing principle</span>
        <p>Gold creates passage. Relationship determines what passage is for.</p>
      </div>
    </section>
  );
}
