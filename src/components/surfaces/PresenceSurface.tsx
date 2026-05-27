import styles from './PresenceSurface.module.css'

export default function PresenceSurface() {
  return (
    <div className={styles.presenceSurface}>
      <div className="surfaceFrame">
        <div className={styles.chamber}>

          <div className={styles.presenceMark} aria-hidden="true">
            <img
              src="/sigil/v4/axis_sigil_full.png"
              alt=""
              className={styles.sigil}
              draggable={false}
            />
          </div>

          <div className={styles.closingStatement}>
            <span className={styles.kicker}>PRESENCE</span>

            <h2>
              Systems endure when continuity is held.
            </h2>

            <p>
              AXPT develops coordination environments for verification,
              custody, institutional memory, and accountable exchange.
            </p>
          </div>

          <footer className={styles.footerBar} aria-label="Footer">
            <div className={styles.col}>
              <div className={styles.footerValue}>
                ENGINEERED INFRASTRUCTURE LAYER
              </div>
            </div>

            <div className={styles.colCenter}>
              <div className={styles.footerTitle}>CONNECT</div>
              <a
                className={styles.footerLink}
                href="mailto:connect@axpt.io"
              >
                connect@axpt.io
              </a>
            </div>

            <div className={styles.col}>
              <div className={styles.footerValue}>
                © {new Date().getFullYear()} AXIS POINT
              </div>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}