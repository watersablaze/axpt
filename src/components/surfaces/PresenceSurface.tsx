'use client'

import styles from './PresenceSurface.module.css'

export default function PresenceSurface() {

  return (
    <section
      className={`surface ${styles.presenceSurface}`}
      data-layer="PRESENCE"
      aria-label="Presence Layer"
    >

      <div className="surfaceFrame">

        <div className={styles.chamber}>

          {/* Sigil watermark */}
          <div className={styles.sigilWrapper} aria-hidden="true">
            <img
              src="/sigil/v4/axis_sigil_full.png"
              alt=""
              className={styles.sigil}
              draggable={false}
            />
          </div>

          {/* Presence copy */}
          <div className={styles.presenceField}>
            <p>
              The system holds record, authority, and witness.
              Presence is the moment when structure and humanity
              remain visible to one another.
            </p>
          </div>

          {/* Footer */}
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

    </section>
  )
}