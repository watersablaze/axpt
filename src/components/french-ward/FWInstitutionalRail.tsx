import styles from './FWInstitutionalRail.module.css'

const domains = [
  'Trade',
  'Commodity Architecture',
  'Source-Side Coordination',
  'Institutional Readiness',
  'Settlement & Passage',
]

const principles = [
  'Authority must be attributable.',
  'Evidence must remain current.',
  'Movement requires more than possession.',
  'Settlement requires more than a rail.',
]

export default function FWInstitutionalRail() {
  return (
    <div className={styles.rail} id="profile">
      <section className={styles.profileHeader}>
        <p className={styles.kicker}>Institutional Profile</p>

        <p className={styles.profileCode}>
          FW / Public Orientation
        </p>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Orientation</p>

        <p className={styles.copy}>
          French-Ward studies and coordinates the conditions that allow
          high-value trade to move with attributable authority, documentary
          continuity, lawful passage, and settlement integrity.
        </p>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Domains</p>

        <ul className={styles.list}>
          {domains.map((domain) => (
            <li key={domain}>{domain}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Operating Principles</p>

        <ul className={styles.principles}>
          {principles.map((principle, index) => (
            <li key={principle}>
              <span className={styles.principleIndex}>
                {String(index + 1).padStart(2, '0')}
              </span>

              <span>{principle}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Current Lens</p>

        <p className={styles.lens}>
          Gold / Passage / Export Governance
        </p>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>Field Index</p>

        <a className={styles.fieldLink} href="#field-notes">
          <span className={styles.fieldNumber}>001</span>

          <span className={styles.fieldIdentity}>
            <span>Gold &amp; Passage</span>
            <span>September 2026</span>
          </span>
        </a>
      </section>
    </div>
  )
}
