import styles from "./AuthorityArchitecture.module.css";

const reserved = [
  "Royal identity, names and titles",
  "Family recognition and Royal appointments",
  "Crests, seals, sacred and cultural symbols",
  "Final approval of Royal representations",
  "Authorization of Royal digital issuance",
];

const joint = [
  "Definitive commercial agreements",
  "Royal-branded projects and initiatives",
  "Opening of new international trade corridors",
  "Material public representations involving both Parties",
  "Economic evolution of the Royal Digital Heritage Instrument",
];

const delegated = [
  "Institutional and documentary architecture",
  "Controlled counterparty coordination",
  "Receiving-refinery development",
  "Trade-passage preparation",
  "Project architecture and development",
  "Digital-system development",
  "Documentary preservation and institutional record",
];

const prohibited = [
  "Unauthorized fundraising or asset solicitation",
  "Impersonation or invention of authority",
  "Unapproved commitments in another Party's name",
  "Unilateral mutation of Royal identity or representation",
  "Unauthorized digital issuance or commercial encumbrance",
];

function AuthorityList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function AuthorityArchitecture() {
  return (
    <section
      className={styles.field}
      aria-label="Royal custodial authority architecture"
    >
      <div className={styles.fieldMeta}>
        <span>Authority Field 02</span>
        <span>GM-KENYA-RCF-001</span>
      </div>

      <div className={styles.diagram}>
        <div className={styles.geometry} aria-hidden="true">
          <span className={styles.cornerTL} />
          <span className={styles.cornerTR} />
          <span className={styles.cornerBL} />
          <span className={styles.cornerBR} />

          <span className={styles.axis} />
          <span className={styles.authorityBar} />
          <span className={styles.reservedDrop} />
          <span className={styles.jointDrop} />
          <span className={styles.delegatedDrop} />
          <span className={styles.prohibitedStem} />
        </div>

        <article className={`${styles.principal} ${styles.node}`}>
          <span className={styles.eyebrow}>Constitutional Source</span>
          <h3>Royal Authority</h3>
          <p>
            Authority begins with the Royal principal and is expressed through
            defined reservation, joint action and deliberate delegation.
          </p>
        </article>

        <article className={`${styles.reserved} ${styles.authorityClass}`}>
          <div className={styles.classHeader}>
            <span>01</span>
            <strong>Reserved</strong>
          </div>

          <h3>Royal Authority Retained</h3>
          <p>
            Matters that remain under Royal control unless expressly delegated.
          </p>

          <AuthorityList items={reserved} />
        </article>

        <article className={`${styles.joint} ${styles.authorityClass}`}>
          <div className={styles.classHeader}>
            <span>02</span>
            <strong>Joint</strong>
          </div>

          <h3>Mutual Authorization</h3>
          <p>
            Matters requiring affirmative participation or approval from both
            the Royal authority and French-Ward.
          </p>

          <AuthorityList items={joint} />
        </article>

        <article className={`${styles.delegated} ${styles.authorityClass}`}>
          <div className={styles.classHeader}>
            <span>03</span>
            <strong>Delegated</strong>
          </div>

          <h3>French-Ward Custodianship</h3>
          <p>
            Defined authorities entrusted to French-Ward for institutional
            development and controlled execution.
          </p>

          <AuthorityList items={delegated} />
        </article>

        <article className={`${styles.prohibited} ${styles.prohibition}`}>
          <div>
            <span className={styles.eyebrow}>04 / Boundary</span>
            <h3>Prohibited Authority</h3>
          </div>

          <p>
            Actions that neither relationship, title, access nor participation
            authorizes without a separate lawful mandate.
          </p>

          <AuthorityList items={prohibited} />
        </article>
      </div>

      <div className={styles.doctrine}>
        <span>Authority Doctrine 02</span>

        <p>
          Custodianship does not transfer sovereignty. Authority exists only
          where it is reserved, jointly exercised, or expressly delegated.
        </p>
      </div>
    </section>
  );
}
