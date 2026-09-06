import styles from './PresenceSurface.module.css'

export default function PresenceSurface() {
  return (
    <div className={styles.presenceSurface}>
      <div className={styles.sealInner}>

        <p className={styles.registration}>
          Axis Point / Seal
        </p>

        <div className={styles.sealField}>
          <div
            className={styles.sealMark}
            aria-hidden="true"
          >
            <span className={styles.registrationRing} />

            <img
              src="/sigil/v4/axis_sigil_full.png"
              alt=""
              className={styles.sigil}
              draggable={false}
            />
          </div>

          <div className={styles.closingStatement}>
            <h2>
              What moves may continue.
              <span>
                What has been established should remain known.
              </span>
            </h2>

            <p>
              AXPT develops coordination infrastructure for
              continuity through change.
            </p>
          </div>
        </div>

        <footer
          className={styles.footerBar}
          aria-label="AXPT footer"
        >
          <div className={styles.footerIdentity}>
            <span>AXPT</span>
            <span>AXIS POINT</span>
          </div>

          <div className={styles.footerContact}>
            <span className={styles.footerLabel}>
              CONNECT
            </span>

            <a
              href="mailto:connect@axpt.io"
              className={styles.footerLink}
            >
              connect@axpt.io
            </a>
          </div>

          <div className={styles.footerRecord}>
            <span>
              © {new Date().getFullYear()} AXIS POINT
            </span>
          </div>
        </footer>

      </div>
    </div>
  )
}
