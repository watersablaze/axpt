import styles from "./EconomicCorridor.module.css";

const passageStages = [
  {
    index: "01",
    key: "source",
    eyebrow: "Origin",
    title: "Source / Motherland",
    body: "The relational and physical origin from which the opportunity enters governed passage.",
  },
  {
    index: "02",
    key: "authority",
    eyebrow: "Authority",
    title: "Source Authority",
    body: "Identity, lawful control, custodianship and authority to make the product available.",
  },
  {
    index: "03",
    key: "verification",
    eyebrow: "Evidence",
    title: "Verification",
    body: "Product, documentation, live witnessing and counterparty verification sufficient for progression.",
  },
  {
    index: "04",
    key: "passage",
    eyebrow: "Readiness",
    title: "Passage",
    body: "Export, logistics, insurance, documentary and transaction conditions assembled for movement.",
  },
  {
    index: "05",
    key: "gateway",
    eyebrow: "Destination",
    title: "Receiving Gateway",
    body: "A qualified refinery and settlement environment selected for the transaction.",
  },
  {
    index: "06",
    key: "assay",
    eyebrow: "Reconciliation",
    title: "Assay",
    body: "Physical receipt, assay and reconciliation establish the final settlement basis.",
  },
  {
    index: "07",
    key: "settlement",
    eyebrow: "Realization",
    title: "Settlement",
    body: "Payment, compensation and approved allocations are reconciled against completed performance.",
  },
];

const gateways = [
  {
    place: "Oman",
    status: "PROPOSED",
  },
  {
    place: "Qatar",
    status: "PROPOSED",
  },
  {
    place: "UAE / Dubai",
    status: "PROPOSED",
  },
  {
    place: "Europe",
    status: "PROPOSED",
  },
];

const returnObjects = [
  "Project advancement",
  "Family and community value",
  "Institutional development",
  "Annual return / homage",
  "Continuing relationship",
];

export function EconomicCorridor() {
  return (
    <section
      className={styles.field}
      aria-label="Economic corridor architecture"
    >
      <div className={styles.fieldMeta}>
        <span>Passage Field 03</span>
        <span>GM-KENYA-RCF-001</span>
      </div>

      <div className={styles.corridor}>
        <div className={styles.corridorRail} aria-hidden="true" />

        {passageStages.map((stage) => (
          <article
            key={stage.key}
            className={`${styles.stage} ${styles[stage.key]}`}
          >
            <div className={styles.stageHeader}>
              <span>{stage.index}</span>
              <strong>{stage.eyebrow}</strong>
            </div>

            <h3>{stage.title}</h3>
            <p>{stage.body}</p>

            {stage.key === "gateway" ? (
              <div className={styles.gatewayOptions}>
                {gateways.map((gateway) => (
                  <div key={gateway.place}>
                    <span>{gateway.place}</span>
                    <small>{gateway.status}</small>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className={styles.passageDoctrine}>
        <div>
          <span>Passage Principle</span>
          <h3>Availability is not passage.</h3>
        </div>

        <p>
          The existence of an asset does not establish its lawful or executable
          movement. Passage emerges only when authority, evidence, logistics,
          receiving capacity and settlement are governed together.
        </p>
      </div>

      <div className={styles.returnField}>
        <div className={styles.returnHeader}>
          <div>
            <span>Return Architecture</span>
            <h3>The corridor does not terminate at settlement.</h3>
          </div>

          <p>
            Physical value may move outward. Realized value is intended to return
            through productive works, family benefit and continuing institutional
            relationship.
          </p>
        </div>

        <div className={styles.returnCycle}>
          <div className={styles.returnOrigin}>
            <span>Settlement</span>
          </div>

          <div className={styles.returnLine} aria-hidden="true" />

          <div className={styles.returnObjects}>
            {returnObjects.map((item, index) => (
              <article key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>

          <div className={styles.returnResolution}>
            <span>Renewal</span>
            <strong>Continuity</strong>
          </div>
        </div>
      </div>

      <div className={styles.doctrine}>
        <span>Corridor Doctrine 03</span>

        <p>
          Resource passage becomes constructive only when movement outward is
          joined to accountable value realization and productive return.
        </p>
      </div>
    </section>
  );
}
