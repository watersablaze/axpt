import styles from './EthosSurface.module.css'

const CARRIED_FORWARD = [
  {
    label: 'Consequence / Responsibility',
    text: 'What happened continues to shape what comes next; accountability stays connected as conditions change.',
  },
  {
    label: 'Obligation / Record',
    text: 'Commitments continue with what moves forward; what was established remains available to the next decision.',
  },
] as const

export default function EthosSurface() {
  return (
    <div
      className={styles.ethosSurface}
    >
      <div className={styles.ethosInner}>

        {/* 01 — DECLARATION */}
        <header className={styles.declaration}>
          <h2>
            What moves carries
            <span> consequence with it.</span>
          </h2>
        </header>

        {/* 02 — TRANSMISSION FIELD */}
        <div
          className={styles.transmissionField}
          aria-label="What moves and what remains connected through circulation"
        >
          <section className={styles.movementField}>
            <span className={styles.fieldRegistration}>
              What moves
            </span>

            <p className={styles.movementStatement}>
              Value, information, custody, authority,
              and institutional state.
            </p>
          </section>

          <div className={styles.passageField}>
            <span className={styles.passageRegistration}>
              Circulation
            </span>

            <div
              className={styles.passageRule}
              aria-hidden="true"
            />

            <div
              className={styles.circulationFieldVisual}
              aria-hidden="true"
            >
              <span className={styles.circulationTrack} />
              <span className={styles.circulationParticle} />
            </div>

            <p className={styles.circulationDoctrine}>
              What moves does not move alone.
            </p>
          </div>

          <section className={styles.mobileCarriedField}>
            <span className={styles.mobileCarriedRegistration}>
              Carried forward
            </span>

            <div className={styles.mobileRelationshipField}>
              <article className={styles.mobileRelationship}>
                <h3>
                  Consequence / Responsibility
                </h3>

                <p>
                  What happened continues to shape what comes next;
                  accountability stays connected as conditions change.
                </p>
              </article>

              <article className={styles.mobileRelationship}>
                <h3>
                  Obligation / Record
                </h3>

                <p>
                  Commitments continue with what moves forward;
                  what was established remains available to the next decision.
                </p>
              </article>
            </div>
          </section>

          <section className={styles.carriedField}>
            <span className={styles.fieldRegistration}>
              Carried forward
            </span>

            <div className={styles.carriedRelations}>
              {CARRIED_FORWARD.map((item) => (
                <div
                  className={styles.carriedRelation}
                  key={item.label}
                >
                  <strong>{item.label}</strong>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* 03 — INSTITUTIONAL DEFINITION */}
        <footer className={styles.circulationDefinition}>
          <span className={styles.definitionLabel}>
            CIRCULATION
          </span>

          <p>
            Movement carries relationship. Circulation preserves
            what remains connected through change.
          </p>
        </footer>

      </div>
    </div>
  )
}
