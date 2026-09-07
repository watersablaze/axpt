import styles from './FrameworkSurface.module.css'

const CONDITIONS = [
  {
    label: 'What moves',
    text: 'Value, information, assets, agreements, and institutional state.',
  },
  {
    label: 'Who can act',
    text: 'Authority, permission, role, and consent.',
  },
  {
    label: 'What has been established',
    text: 'Evidence, verification, terms, and current state.',
  },
  {
    label: 'Who remains responsible',
    text: 'Custody, obligation, accountability, and record.',
  },
] as const

export default function FrameworkSurface() {
  return (
    <section className={styles.frameworkSurface}>
      <div className={styles.frameworkInner}>

        <header className={styles.declaration}>
          <h2>
            Movement depends on more
            <span> than what is moving.</span>
          </h2>
        </header>

        <div className={styles.explanation}>
          <p>
            Every action proceeds from conditions: what is moving,
            who can act, what has been established, and who remains
            responsible.
          </p>

          <p className={styles.explanationFocus}>
            AXPT coordinates what must remain connected as activity moves.
          </p>
        </div>

        <div
          className={styles.conditionField}
          aria-label="Conditions coordinated by AXPT"
        >
          {CONDITIONS.map((condition) => (
            <article
              className={styles.condition}
              key={condition.label}
            >
              <h3>{condition.label}</h3>
              <p>{condition.text}</p>
            </article>
          ))}

          <div
            className={styles.axisRegistration}
            aria-hidden="true"
          >
            <span className={styles.axisPoint} />
          </div>
        </div>

        <footer className={styles.axisDefinition}>
          <span className={styles.axisLabel}>AXIS POINT</span>

          <p>
            An Axis Point establishes the conditions from which
            the next action can responsibly proceed.
          </p>
        </footer>

      </div>
    </section>
  )
}
