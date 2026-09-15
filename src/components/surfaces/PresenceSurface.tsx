import styles from './PresenceSurface.module.css'

export default function PresenceSurface() {
  return (
    <div
      className={styles.sealSurface}
    >
      <div className={styles.inner}>
        <div className={styles.sealField}>
          <aside
            className={styles.sealWitness}
            aria-label="AXPT seal witness"
          >
            <p className={styles.witnessMarker}>
              Witness
            </p>

            <img
              src="/sigil/v4/axis_sigil_full.png"
              alt=""
              className={styles.sealMark}
              draggable={false}
            />

            <div className={styles.sealWitnessText}>
              <span className={styles.sealLabel}>
                AXPT
              </span>

              <span className={styles.sealClassification}>
                Witness / Continuity Record / Seal
              </span>
            </div>
          </aside>

          <section
            className={styles.declarationField}
            aria-labelledby="presence-declaration"
          >
            <p className={styles.fieldMarker}>
              Continuity / Accountability / Record
            </p>

            <div
              id="presence-declaration"
              className={styles.articles}
            >
              <article className={styles.article}>
                <div className={styles.articleHead}>
                  <span className={styles.articleNumber}>
                    01
                  </span>

                  <span className={styles.articleLabel}>
                    Continuity
                  </span>
                </div>

                <p className={styles.articleStatement}>
                  What proceeds must remain accountable.
                </p>
              </article>

              <article className={styles.article}>
                <div className={styles.articleHead}>
                  <span className={styles.articleNumber}>
                    02
                  </span>

                  <span className={styles.articleLabel}>
                    Establishment
                  </span>
                </div>

                <p className={styles.articleStatement}>
                  What has been established must remain known.
                </p>
              </article>
            </div>

            <div className={styles.attestation}>
              <p className={styles.attestationLabel}>
                Attestation
              </p>

              <p className={styles.attestationStatement}>
                AXPT establishes the coordination conditions through which
                continuity may be responsibly maintained.
              </p>
            </div>
          </section>
        </div>

        <div
        className={styles.terminalSealField}
        aria-hidden="true"
      >
        <img
          src="/sigil/v4/axis_sigil_full.png"
          alt=""
          className={styles.terminalSeal}
          draggable={false}
        />
      </div>

      <footer
          className={styles.attestationRail}
          aria-label="AXPT institutional contact and authority"
        >
          <span className={styles.attestationLeft}>
            AXPT
          </span>

          <a
            href="mailto:connect@axpt.io"
            className={styles.attestationCenter}
          >
            connect@axpt.io
          </a>

          <span className={styles.attestationRight}>
            Established authority governs what proceeds
          </span>
        </footer>
      </div>
    </div>
  )
}
