import styles from "./GlobalMotherRelationshipFieldV2.module.css";

export function GlobalMotherRelationshipFieldV2() {
  return (
    <section className={styles.field} aria-label="Article I relationship field">
      <div className={styles.registry}>
        <div className={styles.label}><span>REL-01</span><span>Institutional recognition</span></div>
        <div className={styles.twoColumns}>
          <div>
            <p className={styles.eyebrow}>ND Royal Ministry / Royal principal</p>
            <h3>Dr. Awulah Naanii Amon</h3>
            <p className={styles.identities}>Nubian Empress Omaedro II · Global Mother · ND Royal Ministry representative</p>
          </div>
          <p>French-Ward receives the Global Mother in her presented capacity. ND Royal Ministry is the Royal principal; authority to bind it requires the Ministry’s own governance and evidence.</p>
        </div>
      </div>

      <div className={styles.bridge}>
        <div className={styles.label}><span>REL-02</span><span>The trusted bridge</span></div>
        <div className={styles.twoColumns}>
          <div>
            <p className={styles.eyebrow}>01 / Trust</p>
            <h4>Imperial Khan-Khan</h4>
            <p>Entrusted by the Global Mother to open the relationship.</p>
          </div>
          <div>
            <p className={styles.eyebrow}>02 / Existing relationship</p>
            <h4>Ahma Olmec Tartarian Government</h4>
            <p>AOTG brings its relationship with French-Ward. Trade may support its governmental capacity on terms it authorizes.</p>
          </div>
        </div>
      </div>

      <div className={styles.convergence}>
        <div className={styles.label}><span>REL-03</span><span>Proposed custodial convergence</span></div>
        <h3>Two custodial roles. Distinct authority.</h3>
        <div className={styles.twoColumns}>
          <div>
            <p className={styles.eyebrow}>Trusted bridge & continuing custodian</p>
            <h4>AOTG</h4>
            <p>Protects the bridge and develops governmental capacity through the work.</p>
          </div>
          <div>
            <p className={styles.eyebrow}>Lead institutional custodian</p>
            <h4>French-Ward</h4>
            <p>Stewards the relationship, governed passage, and productive return.</p>
          </div>
        </div>
        <p className={styles.note}>A proposed master agreement would define AOTG–French-Ward, French-Ward–ND Royal Ministry, and shared three-party responsibilities. French-Ward’s gold authority rests on its separate operative mandate.</p>
      </div>

      <div className={styles.anchor}>
        <div className={styles.label}><span>REL-04</span><span>Purpose & present economic anchor</span></div>
        <div className={styles.twoColumns}>
          <div><p className={styles.eyebrow}>The present work</p><h3>Gold is the economic anchor.</h3></div>
          <p>Beyond the gold corridor: restoration, AOTG governmental capacity, projects, cultural continuity, and the two-part Gift in Article IV.</p>
        </div>
      </div>

      <div className={styles.doctrine}>
        <span>Article I / Governing principle</span>
        <p>Relationship establishes the field. Recognition does not establish authority.</p>
      </div>
    </section>
  );
}
