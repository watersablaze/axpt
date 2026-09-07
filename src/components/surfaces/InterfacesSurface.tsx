import styles from './InterfacesSurface.module.css'

const ENCOUNTERS = [
  {
    label: 'Verify',
    text: 'What is known before action proceeds.',
  },
  {
    label: 'Authorize',
    text: 'Who can act under established conditions.',
  },
  {
    label: 'Act',
    text: 'What is caused to proceed.',
  },
  {
    label: 'Record',
    text: 'What remains established after action occurs.',
  },
] as const

export default function InterfacesSurface() {
  return (
    <div className={styles.interfacesSurface}>
      <div className={styles.interfacesInner}>

        <header className={styles.declaration}>
          <h2>
            Conditions become consequential
            <span> at the point of action.</span>
          </h2>
        </header>

        <div className={styles.explanation}>
          <p>
            Infrastructure becomes tangible when
            someone must verify what is known,
            determine who can act, cause something to
            proceed, or establish what occurred.
          </p>
        </div>

        <div
          className={styles.encounterField}
          aria-label="Points of encounter with infrastructure"
        >
          {ENCOUNTERS.map((encounter) => (
            <article
              className={styles.encounter}
              key={encounter.label}
            >
              <h3>{encounter.label}</h3>
              <p>{encounter.text}</p>
            </article>
          ))}

          <div
            className={styles.actionPoint}
            aria-hidden="true"
          >
            <span className={styles.actionLabel}>
              Point of Action
            </span>
          </div>
        </div>

        <footer className={styles.interfaceDefinition}>
          <span className={styles.definitionLabel}>
            INTERFACE
          </span>

          <p>
            An interface is where established conditions
            become actionable.
          </p>
        </footer>
      </div>
    </div>
  )
}
