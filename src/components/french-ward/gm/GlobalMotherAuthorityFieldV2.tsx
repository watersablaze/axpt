import styles from "./GlobalMotherAuthorityFieldV2.module.css";

const schedule = [
  {
    reference: "AUTH-01",
    classification: "RESERVED",
    party: "ND Royal Ministry",
    role: "Royal principal / reserved authority",
    scope: "Royal identity, governance, culture, representation, and participation.",
    boundary: "The Global Mother’s capacity to represent or bind the Ministry requires its own authority and evidence.",
  },
  {
    reference: "AUTH-02",
    classification: "ENTRUSTED ROLE",
    party: "Ahma Olmec Tartarian Government (AOTG)",
    role: "Trusted bridge & governmental participant",
    scope: "Introduction, protection, coordination, and governmental capacity through trade.",
    boundary: "AOTG defines its governmental decisions and the authority it brings to joint work.",
  },
  {
    reference: "AUTH-03",
    classification: "JOINT / PROPOSED",
    party: "AOTG + French-Ward",
    role: "Custodial convergence",
    scope: "Shared custodial work and support for AOTG’s governmental capacity.",
    boundary: "Their respective powers and duties await agreement; joint work does not merge their authority.",
  },
  {
    reference: "AUTH-04",
    classification: "LEAD CUSTODIAN / PROPOSED",
    party: "French-Ward",
    role: "Lead institutional custodian",
    scope: "Stewardship of the relationship, trade passage, projects, Treasury, and continuity.",
    boundary: "Custodial stewardship and commercial authority remain distinct.",
  },
  {
    reference: "AUTH-05",
    classification: "COMMERCIAL / MANDATED",
    party: "French-Ward",
    role: "Gold-selling & trading authority",
    scope: "Gold selling and trading under the operative mandate.",
    boundary: "Gold-selling authority, where applicable, is governed by the operative mandate.",
  },
] as const;

export function GlobalMotherAuthorityFieldV2() {
  return (
    <section className={styles.field} aria-label="Article II authority schedule">
      <div className={styles.intro}>
        <span>Authority schedule / AUTH-01—05</span>
        <p>Each role has a source, scope, and boundary.</p>
      </div>

      <div className={styles.schedule}>
        <div className={styles.columns} aria-hidden="true">
          <span>Class / proposition</span><span>Party & role</span><span>Scope & boundary</span>
        </div>
        {schedule.map((entry, index) => (
          <article className={styles.row} key={`${entry.reference}-${index}`}>
            <div className={styles.classification}>
              <span>{entry.reference}</span>
              <strong>{entry.classification}</strong>
            </div>
            <div className={styles.party}>
              <h3>{entry.party}</h3>
              <p>{entry.role}</p>
            </div>
            <div className={styles.details}>
              <p>{entry.scope}</p>
              <small>{entry.boundary}</small>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.record}>
        <span>AUTH-06 / Treasury relationship</span>
        <h3>Treasury coordination supports continuity across the relationship.</h3>
        <p>
          Chief Jamarú Wata Falkhan · Jamal James Ward serves French-Ward
          as Chief Strategic Officer and provides Treasury Consultant
          support to the Ahma Olmec Tartarian Government (AOTG). The
          advisory relationship supports treasury coordination,
          institutional understanding, and continuity across the
          developing relationship while each institutional capacity
          remains distinct.
        </p>
      </div>

      <div className={styles.record}>
        <span>AUTH-07 / Express authority & institutional record</span>
        <h3>Authority must be traceable.</h3>
        <div className={styles.elements} aria-label="Elements of authority">
          <span>Source</span><span>Holder</span><span>Subject</span><span>Scope</span><span>Conditions</span><span>Evidence</span>
        </div>
        <p>Axis Point records principals, representatives, capacities, and responses. The record grants no authority.</p>
        <p className={styles.prohibition}><strong>BOUNDARY</strong> Trust, title, access, or custodianship alone cannot bind another party.</p>
      </div>

      <div className={styles.doctrine}>
        <span>Article II / Governing principle</span>
        <p>Trust establishes relationship. Authority establishes the perimeter of action.</p>
      </div>
    </section>
  );
}
