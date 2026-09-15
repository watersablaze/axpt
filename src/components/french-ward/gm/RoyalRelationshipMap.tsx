import styles from "./RoyalRelationshipMap.module.css";

export function RoyalRelationshipMap() {
  return (
    <section className={styles.field} aria-label="Royal relationship field">
      <div className={styles.fieldMeta}>
        <span>Relational Field 01</span>
        <span>GM-KENYA-RCF-001</span>
      </div>

      <div className={styles.diagram}>
        <div className={styles.geometry} aria-hidden="true">
          <span className={styles.cornerTL} />
          <span className={styles.cornerTR} />
          <span className={styles.cornerBL} />
          <span className={styles.cornerBR} />

          <span className={styles.axisVertical} />
          <span className={styles.branchHorizontal} />
          <span className={styles.branchLeftDrop} />
          <span className={styles.branchRightDrop} />

          <span className={styles.mergeLeft} />
          <span className={styles.mergeRight} />
          <span className={styles.familyStem} />

          <span className={styles.ingressLine} />
        </div>

        <aside className={styles.ingress}>
          <span className={styles.nodeEyebrow}>Relational Ingress</span>
          <h3>Sovereign Associates</h3>
          <p>
            Trusted introduction through which the Royal relationship entered
            the field.
          </p>
        </aside>

        <article className={`${styles.node} ${styles.greatMother}`}>
          <span className={styles.nodeEyebrow}>Royal Principal</span>
          <h3>Great Mother</h3>
          <p>Originating invitation and Royal relationship.</p>
        </article>

        <article className={`${styles.node} ${styles.royalAuthority}`}>
          <span className={styles.nodeEyebrow}>Constitutional Layer</span>
          <h3>Royal Authority</h3>
          <p>Identity, Council, reserved powers and authorization.</p>
        </article>

        <article className={`${styles.node} ${styles.royalCouncil}`}>
          <span className={styles.nodeEyebrow}>Governance</span>
          <h3>Royal Council</h3>
          <p>Deliberation, confirmation and continuing authority.</p>
        </article>

        <article className={`${styles.node} ${styles.frenchWard}`}>
          <span className={styles.nodeEyebrow}>Proposed Custodianship</span>
          <h3>French-Ward</h3>
          <p>
            Institutional architecture, stewardship and controlled passage.
          </p>
        </article>

        <article className={`${styles.node} ${styles.globalFamily}`}>
          <span className={styles.nodeEyebrow}>Developing Body</span>
          <h3>Global Family</h3>
          <p>Projects, affiliation, productive return and continuity.</p>
        </article>
      </div>

      <div className={styles.doctrine}>
        <span>Relational Doctrine 01</span>

        <p>
          Relationship establishes the field. Authority defines the perimeter.
          Custodianship governs what may responsibly pass through it.
        </p>
      </div>
    </section>
  );
}
