import styles from './FoundationSurface.module.css'

const LEFT_STATES = [
  {
    name: 'Authority',
    note: 'who could act',
  },
  {
    name: 'Evidence',
    note: 'what established it',
  },
  {
    name: 'Custody',
    note: 'what was held',
  },
  {
    name: 'Execution',
    note: 'what moved',
  },
]

const RIGHT_STATES = [
  {
    name: 'Action',
    note: 'what occurred',
  },
  {
    name: 'Decision',
    note: 'what followed',
  },
  {
    name: 'Responsibility',
    note: 'who remained accountable',
  },
  {
    name: 'Record',
    note: 'what remained known',
  },
]

export default function FoundationSurface() {
  return (
    <section className={styles.foundationSurface}>
      <div className={styles.foundationInner}>

        <header className={styles.declaration}>
          <h2>
            <span>Continuity is most vulnerable</span>
            <span className={styles.declarationSecondary}>
              between one state and the next.
            </span>
          </h2>
        </header>

        <div className={styles.explanation}>
          <p>
            Authority may be clear. Evidence may exist.
            Custody may be established. Records may remain.
          </p>

          <p className={styles.explanationFocus}>
            The weakness often appears in the passage
            between one condition and the next.
          </p>
        </div>

        <div
          className={styles.transitionField}
          aria-label="Institutional states across transition"
        >
          <div className={styles.stateBank}>
            {LEFT_STATES.map((state) => (
              <div className={styles.state} key={state.name}>
                <span className={styles.stateName}>{state.name}</span>
                <span className={styles.stateNote}>{state.note}</span>
              </div>
            ))}
          </div>

          <div className={styles.transition}>
            <span className={styles.transitionRule} aria-hidden="true" />

            <div className={styles.transitionLabel}>
              <span>Integrity is tested</span>
              <strong>in transition.</strong>
            </div>

            <span className={styles.transitionRule} aria-hidden="true" />
          </div>

          <div className={`${styles.stateBank} ${styles.stateBankRight}`}>
            {RIGHT_STATES.map((state) => (
              <div className={styles.state} key={state.name}>
                <span className={styles.stateName}>{state.name}</span>
                <span className={styles.stateNote}>{state.note}</span>
              </div>
            ))}
          </div>
        </div>

        <footer className={styles.response}>
          <span className={styles.responseMark}>AXPT</span>

          <p>
            AXPT exists to preserve continuity
            through these transitions.
          </p>
        </footer>

      </div>
    </section>
  )
}
