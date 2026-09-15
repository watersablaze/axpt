import styles from './OriginSurface.module.css'

export default function OriginSurface() {
  return (
    <div
      className={styles.thresholdSurface}
      data-settled="true"
    >
      <div className={styles.thresholdFrame}>

        {/* 01 — DECLARATION / FIRST EVENT */}
        <div className={styles.declaration}>
          <h1 className={styles.primaryStatement}>
            <span>Movement</span>
            <span>is inevitable.</span>
          </h1>
        </div>

        {/* 02 — OBSERVATION */}
        <div
          className={styles.current}
          aria-label="Forms of movement"
        >
          <p className={styles.currentText}>
            <span>Money changes hands.</span>
            <span>People cross borders.</span>
            <span>Knowledge travels.</span>
            <span>Authority transfers.</span>
            <span>Relationships form and change.</span>
          </p>
        </div>

        {/* 03 — INSTITUTIONAL POSITION */}
        <div className={styles.response}>
          <span className={styles.responseLabel}>
            AXPT
          </span>

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
