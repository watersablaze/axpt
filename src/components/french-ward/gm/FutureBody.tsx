import styles from "./FutureBody.module.css";

const projectDomains = [
  "Education",
  "Technology",
  "Agriculture",
  "Infrastructure",
  "Cultural Preservation",
  "Women & Family Development",
  "Media & Arts",
  "Trade Infrastructure",
  "Humanitarian Initiatives",
];

const digitalLayers = [
  {
    index: "01",
    title: "Heritage",
    body: "Lineage, archival records, cultural provenance and enduring memory.",
  },
  {
    index: "02",
    title: "Identity",
    body: "Recognized officials, custodial appointments and authenticated affiliation.",
  },
  {
    index: "03",
    title: "Projects",
    body: "Initiatives, milestones, participation and contribution records.",
  },
  {
    index: "04",
    title: "Governance",
    body: "Authority, issuance, reserved powers and controlled institutional action.",
  },
  {
    index: "05",
    title: "Future Treasury",
    body: "Optional economic functionality, asset linkage and treasury development in later phases.",
  },
];

const returnCycle = [
  "Gather",
  "Share progress",
  "Offer return / homage",
  "Strengthen family bonds",
  "Receive guidance",
  "Renew",
];

export function FutureBody() {
  return (
    <section
      className={styles.field}
      aria-label="Future body architecture"
    >
      <div className={styles.fieldMeta}>
        <span>Future Field 04</span>
        <span>GM-KENYA-RCF-001</span>
      </div>

      <div className={styles.projectField}>
        <div className={styles.projectHeader}>
          <div>
            <span>Project Development</span>
            <h3>Opportunity should become productive capacity.</h3>
          </div>

          <p>
            The purpose of commercial success is not accumulation alone.
            Productive value is intended to strengthen projects, families,
            institutions and future generations.
          </p>
        </div>

        <div className={styles.projectGrid}>
          {projectDomains.map((domain, index) => (
            <article key={domain}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{domain}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.digitalField}>
        <div className={styles.digitalHeader}>
          <div>
            <span>French-Ward Inaugural Gift</span>
            <h3>Royal Digital House</h3>
          </div>

          <p>
            A digital institution for heritage, identity, projects, governance
            and future economic functionality — developed in service of the
            Royal Family rather than as a speculative object.
          </p>
        </div>

        <div className={styles.digitalArchitecture}>
          <div className={styles.digitalCore}>
            <span>Royal Digital House</span>
            <strong>Identity · Heritage · Continuity</strong>
          </div>

          <div className={styles.digitalLayers}>
            {digitalLayers.map((layer) => (
              <article key={layer.index}>
                <div>
                  <span>{layer.index}</span>
                  <strong>{layer.title}</strong>
                </div>
                <p>{layer.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.returnField}>
        <div className={styles.returnHeader}>
          <div>
            <span>Annual Return & Continuity</span>
            <h3>A relationship that renews itself.</h3>
          </div>

          <p>
            Annual return is treated as a cycle of remembrance, accountability,
            gratitude, contribution and renewal rather than a mere recurring fee.
          </p>
        </div>

        <div className={styles.returnCycle}>
          {returnCycle.map((item, index) => (
            <article key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.doctrine}>
        <span>Future Doctrine 04</span>

        <p>
          The relationship should produce institutions, projects, memory and
          continuity — not only transactions.
        </p>
      </div>
    </section>
  );
}
