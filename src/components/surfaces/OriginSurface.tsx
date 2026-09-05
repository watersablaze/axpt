import styles from './OriginSurface.module.css'

export default function OriginSurface() {
  return (
    <div className={styles.thresholdSurface}>
      <div className={`surfaceFrame ${styles.thresholdFrame}`}>

        {/* 01 — DECLARATION */}
        <div className={styles.declaration}>
          <p className={styles.registration}>
            AXIS POINT / THRESHOLD
          </p>

          <h1 className={styles.primaryStatement}>
            Movement is inevitable.
          </h1>
        </div>

        {/* 02 — CURRENT */}
        <div className={styles.current} aria-label="Forms of movement">
          <p className={styles.currentText}>
            <span>Money changes hands.</span>
            <span>People cross borders.</span>
            <span>Knowledge travels.</span>
            <span>Authority transfers.</span>
            <span>Relationships form and change.</span>
          </p>
        </div>

        {/* 03 — CONSEQUENCE */}
        <div className={styles.consequence}>
          <p>
            What moves changes what can happen next.
          </p>
        </div>

        {/* 04 — ORIENTATION */}
        <div className={styles.orientation}>
          <span className={styles.registrationMark} aria-hidden="true" />

          <p>
            Where things stand matters.
          </p>
        </div>

        {/* 05 — INSTITUTIONAL RESPONSE */}
        <div className={styles.response}>
          <span className={styles.responseLabel}>AXPT</span>

          <p>
            AXPT develops coordination infrastructure so that as conditions
            change, what moves remains connected to who can act, what has been
            established, and who remains responsible.
          </p>
        </div>

      </div>
    </div>
  )
}