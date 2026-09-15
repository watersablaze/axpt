import Link from 'next/link'

import styles from './FWThreshold.module.css'

export default function FWThreshold() {
  return (
    <header className={styles.threshold}>
      <div className={styles.inner}>
        <div className={styles.topline}>
          <p className={styles.identity}>French-Ward</p>

          <nav
            className={styles.navigation}
            aria-label="French-Ward navigation"
          >
            <Link href="/">
              Home
            </Link>

            <Link href="#field-notes">
              Field Notes
            </Link>

            <Link href="#archive">
              Archive
            </Link>

            <Link href="/transaction-intake">
              LOI / Intake
            </Link>
          </nav>
        </div>

        <div className={styles.statementRow}>
          <p className={styles.statement}>
            We work where source, authority, documentation,
            passage and settlement must align.
          </p>
        </div>
      </div>
    </header>
  )
}
