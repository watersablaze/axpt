import styles from './FrameworkSurface.module.css'

const DEPENDENCIES = [
  {
    label: 'What has been established',
    text: 'Evidence, verification, terms, and current state.',
  },
  {
    label: 'Who can act',
    text: 'Authority, permission, role, and consent.',
  },
  {
    label: 'Who remains responsible',
    text: 'Custody, obligation, accountability, and record.',
  },
] as const

export default function FrameworkSurface() {
  return (
    <section
      className={styles.frameworkSurface}
    >
      <div className={styles.frameworkInner}>

        {/* 01 — DECLARATION */}
        <header className={styles.declaration}>
          <h2>
            Movement depends on
            <span> what surrounds it.</span>
          </h2>
        </header>

        {/* 02 — SUBJECT */}
        <div className={styles.movementSubject}>
          <span className={styles.fieldLabel}>
            What moves
          </span>

          <p>
            Value, information, assets, agreements,
            and institutional state.
          </p>
        </div>

        {/* 03 — DEPENDENCY FIELD */}
        <div
          className={styles.dependencyField}
          aria-label="Conditions movement depends upon"
        >
          <span className={styles.dependencyStatement}>
            Depends upon
          </span>

          <div className={styles.dependencies}>
            {DEPENDENCIES.map((dependency) => (
              <article
                className={styles.dependency}
                key={dependency.label}
              >
                <h3>{dependency.label}</h3>
                <p>{dependency.text}</p>
              </article>
            ))}
          </div>
        </div>

        {/* MOBILE — RELATIONAL FIELD */}
        <div
          className={styles.mobileRelationalField}
          aria-label="Conditions surrounding the Axis Point"
        >
          <article
            className={`${styles.mobileNode} ${styles.mobileNodeEstablished}`}
          >
            <h3>What has been established</h3>
            <p>
              Evidence, verification, terms,
              and current state.
            </p>
          </article>

          <article
            className={`${styles.mobileNode} ${styles.mobileNodeAuthority}`}
          >
            <h3>Who can act</h3>
            <p>
              Authority, permission, role,
              and consent.
            </p>
          </article>

          <article
            className={`${styles.mobileNode} ${styles.mobileNodeResponsibility}`}
          >
            <h3>Who remains responsible</h3>
            <p>
              Custody, obligation,
              accountability, and record.
            </p>
          </article>

          <div
            className={styles.mobileAxisField}
            aria-label="Axis Point"
          >
            <span
              className={styles.mobileAxisPoint}
              aria-hidden="true"
            />

            <span className={styles.mobileAxisLabel}>
              Axis Point
            </span>
          </div>

          <span
            className={`${styles.mobileTrace} ${styles.mobileTraceEstablished}`}
            aria-hidden="true"
          />

          <span
            className={`${styles.mobileTrace} ${styles.mobileTraceAuthority}`}
            aria-hidden="true"
          />

          <span
            className={`${styles.mobileTrace} ${styles.mobileTraceResponsibility}`}
            aria-hidden="true"
          />
        </div>

        {/* 04 — ESTABLISHED POSITION */}
        <div className={styles.establishedPosition}>
          <div className={styles.axisPosition}>
            <span
              className={styles.axisPoint}
              aria-hidden="true"
            />

            <span className={styles.axisPositionLabel}>
              Axis Point
            </span>
          </div>
        </div>

        {/* 05 — INSTITUTIONAL DEFINITION */}
        <footer className={styles.axisDefinition}>
          <span className={styles.axisLabel}>
            AXIS POINT
          </span>

          <p>
            An Axis Point establishes the conditions from which
            the next action can responsibly proceed.
          </p>
        </footer>

      </div>
    </section>
  )
}
