import Link from 'next/link'

import styles from './FWThreshold.module.css'

export default function FWThreshold() {
  return (
    <header className={styles.threshold}>
      <div className={styles.inner}>
        <div className={styles.topline}>
          <div>
            <p className={styles.identity}>
              French-Ward, Inc.
            </p>

            <p className={styles.identityClass}>
              Secure Commodity Management
            </p>
          </div>

          <nav
            className={styles.navigation}
            aria-label="French-Ward navigation"
          >
            <Link href="/">
              AXPT
            </Link>

            <Link href="#profile">
              Profile
            </Link>

            <Link href="/french-ward/transaction-intake">
              LOI / Intake
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
