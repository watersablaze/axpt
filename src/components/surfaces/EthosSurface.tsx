import styles from './EthosSurface.module.css'

const PASSAGE_STATES = [
  {
    label: 'Action',
    text: 'Something proceeds.',
  },
  {
    label: 'Transfer',
    text: 'Value, information, custody, authority, or state changes position.',
  },
  {
    label: 'Consequence',
    text: 'What moved changes what becomes possible next.',
  },
  {
    label: 'Continuity',
    text: 'Responsibility and record remain connected through the change.',
  },
] as const

export default function EthosSurface() {
  return (
    <div className={styles.ethosSurface}>
      <div className={styles.ethosInner}>
        <p className={styles.registration}>
          Axis Point / Circulation
        </p>

        <header className={styles.declaration}>
          <h2>
            What moves carries
            <span> consequence with it.</span>
          </h2>
        </header>

        <div className={styles.explanation}>
          <p>
            An action may begin at a single point, but its effects
            continue through records, relationships, obligations,
            and subsequent decisions.
          </p>
        </div>

        <div
          className={styles.passage}
          aria-label="Circulation through action, transfer, consequence, and continuity"
        >
          <div className={styles.passageLine} aria-hidden="true">
            <span className={styles.originMark} />
            <span className={styles.directionMark} />
          </div>

          {PASSAGE_STATES.map((state, index) => (
            <article
              className={styles.passageState}
              key={state.label}
              data-position={index + 1}
            >
              <span
                className={styles.stateMark}
                aria-hidden="true"
              />

              <div className={styles.stateBody}>
                <h3>{state.label}</h3>
                <p>{state.text}</p>
              </div>
            </article>
          ))}
        </div>

        <footer className={styles.circulationDefinition}>
          <span className={styles.definitionLabel}>
            CIRCULATION
          </span>

          <p>
            Movement continues. Responsibility must remain
            traceable through it.
          </p>
        </footer>
      </div>
    </div>
  )
}
