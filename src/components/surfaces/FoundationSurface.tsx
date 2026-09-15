import styles from './FoundationSurface.module.css'

const CONTINUITY_PAIRS = [
  {
    before: {
      name: 'Authority',
      statement: 'establishes who could act.',
    },
    after: {
      name: 'Action',
      statement: 'establishes what occurred.',
    },
  },
  {
    before: {
      name: 'Evidence',
      statement: 'establishes the basis.',
    },
    after: {
      name: 'Decision',
      statement: 'establishes what followed.',
    },
  },
  {
    before: {
      name: 'Custody',
      statement: 'establishes what was held.',
    },
    after: {
      name: 'Responsibility',
      statement: 'establishes who remained accountable.',
    },
  },
  {
    before: {
      name: 'Execution',
      statement: 'establishes what moved.',
    },
    after: {
      name: 'Record',
      statement: 'establishes what remained known.',
    },
  },
] as const

export default function FoundationSurface() {
  return (
    <section
      className={styles.foundationSurface}
    >
      <div className={styles.foundationInner}>

        <header className={styles.declaration}>
          <h2>
            <span>Continuity is most vulnerable</span>
            <span className={styles.declarationSecondary}>
              between one state and the next.
            </span>
          </h2>
        </header>

        <div
          className={styles.continuityField}
          aria-label="Continuity through transition"
        >
          <aside className={styles.transitionCondition}>
            <p className={styles.transitionStatement}>
              <span>Integrity is tested</span>
              <strong>in transition.</strong>
            </p>

            <div
              className={styles.displacement}
              aria-hidden="true"
            >
              <span className={styles.displacementBefore} />
              <span className={styles.displacementAfter} />
            </div>
          </aside>

          <div
            className={styles.relationField}
            aria-label="Conditions that continuity preserves"
          >
            {CONTINUITY_PAIRS.map((pair) => (
              <div
                className={styles.relation}
                key={pair.before.name}
              >
                <p className={styles.relationPart}>
                  <strong>{pair.before.name}</strong>
                  <span>{pair.before.statement}</span>
                </p>

                <p className={styles.relationPart}>
                  <strong>{pair.after.name}</strong>
                  <span>{pair.after.statement}</span>
                </p>
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
