import styles from "./GlobalMotherPassageFieldV2.module.css";

const readinessConditions =
  [
    {
      number: "01",
      title: "Source",
      condition:
        "The origin of the gold and presenting custodial position become visible.",
    },
    {
      number: "02",
      title: "Authority",
      condition:
        "The authority under which the gold may be offered, held, sold, or moved is established.",
    },
    {
      number: "03",
      title: "Evidence",
      condition:
        "Product identity, provenance, inspection, assay, or equivalent evidence is recognized.",
    },
    {
      number: "04",
      title: "Commercial Basis",
      condition:
        "Quantity, pricing basis, transaction structure, and governing instruments are defined.",
    },
    {
      number: "05",
      title: "Receiving Capacity",
      condition:
        "The receiving refinery, destination, or qualified pathway is prepared.",
    },
    {
      number: "06",
      title: "Passage Coordination",
      condition:
        "Route, responsibilities, documentary requirements, and handling conditions are aligned.",
    },
    {
      number: "07",
      title: "Settlement & Return",
      condition:
        "Settlement pathway and intended productive return are established.",
    },
    {
      number: "08",
      title: "Authority to Move",
      condition:
        "Movement begins only after recognized readiness and explicit authorization.",
    },
  ] as const;

const originatingProposition =
  [
    {
      label:
        "Receiving Field",
      body:
        "Potential receiving and refinery relationships were contemplated across Oman, Qatar, the United Arab Emirates, Europe, or another mutually accepted jurisdiction.",
    },
    {
      label:
        "Verification Before Scale",
      body:
        "The proposition contemplated direct exchange of refinery and seller credentials, including buyer-side presence or accompaniment in the Motherland to establish direct visibility and confidence before larger movement.",
    },
    {
      label:
        "Commercial Formation",
      body:
        "An opening commercial basis referencing LBMA pricing was introduced for discussion. Quantity, discount, settlement, delivery, and other obligations remain subject to authenticated transaction instruments.",
    },
    {
      label:
        "Productive Return",
      body:
        "The originating proposition included a scaled return concept associated with successful passage, including a three-kilogram / USD 300,000 contribution concept following arrival of 1,000 kilograms at final destination.",
    },
    {
      label:
        "Participation Structure",
      body:
        "Affiliate, facilitation, and participation concepts remain subject to later definition among appropriate parties.",
    },
  ] as const;

export function GlobalMotherPassageFieldV2() {
  return (
    <section
      className={styles.field}
      aria-label="Article III gold passage"
    >
      <section className={styles.readiness}>
        <header className={styles.readinessHeader}>
          <div>
            <span>
              PASS-01 / Pre-passage readiness
            </span>

            <h3>
              Before passage,
              conditions must become visible.
            </h3>
          </div>

          <p>
            Gold does not move because interest exists.
            Passage begins when source, authority,
            evidence, receiving capacity, and
            settlement conditions converge into
            a recognized pathway.
          </p>
        </header>

        <div
          className={styles.schedule}
          aria-label="Eight pre-passage readiness conditions"
        >
          {readinessConditions.map(
            condition => (
              <article
                key={condition.number}
                className={styles.condition}
              >
                <span
                  className={
                    styles.conditionNumber
                  }
                >
                  {condition.number}
                </span>

                <div>
                  <h4>
                    {condition.title}
                  </h4>

                  <p>
                    {condition.condition}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      <section className={styles.doctrine}>
        <span>
          PASS-02 / Passage doctrine
        </span>

        <strong>
          No gold advances on assumption.
        </strong>

        <h3>
          Movement follows qualified
          conditions, not urgency alone.
        </h3>

        <div className={styles.doctrineLines}>
          <p>Existence is not passage.</p>
          <p>Recognition is not authority.</p>
          <p>Commercial interest is not execution.</p>
          <p>
            Each material condition must become
            sufficiently clear before movement
            proceeds.
          </p>
        </div>
      </section>

      <section className={styles.proposition}>
        <header className={styles.propositionHeader}>
          <span>
            PASS-03 / Originating proposition
          </span>

          <h3>
            The originating proposition established
            a possible passage pathway.
          </h3>
        </header>

        <div className={styles.propositionGrid}>
          {originatingProposition.map(
            item => (
              <article
                key={item.label}
                className={
                  styles.propositionItem
                }
              >
                <span>
                  {item.label}
                </span>

                <p>
                  {item.body}
                </p>
              </article>
            ),
          )}
        </div>

        <div className={styles.propositionBoundary}>
          <span>
            Proposition, not execution
          </span>

          <p>
            A passage concept establishes direction,
            not obligation. It does not itself
            create quantity, price, refinery
            commitment, settlement authority,
            commission entitlement, or authority
            to move gold. Operative terms arise
            only through authenticated
            instruments and satisfied passage
            conditions.
          </p>
        </div>
      </section>

      <section className={styles.nextAct}>
        <span>
          PASS-04 / Readiness record
        </span>

        <div>
          <h3>
            Name the condition. Assign the next
            act.
          </h3>

          <p>
            Record what is established, what
            remains open, who is responsible,
            and what evidence is required.
            Movement follows the record when
            conditions converge.
          </p>
        </div>

        <div
          className={styles.recordFields}
          aria-label="Active passage record fields"
        >
          <span>Current condition</span>
          <span>Next act</span>
          <span>Open condition</span>
          <span>Responsible party</span>
          <span>Required evidence</span>
        </div>
      </section>
    </section>
  );
}
