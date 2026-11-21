import Link from 'next/link'

import styles from './FWFooter.module.css'

export default function FWFooter() {
  return (
    <footer
      className={styles.footer}
      aria-label="French-Ward footer"
    >
      <div className={styles.inner}>
        <div className={styles.identity}>
          <span className={styles.name}>French-Ward</span>
          <span className={styles.descriptor}>
            Trade &amp; Field Intelligence
          </span>
        </div>

        <nav
          className={styles.navigation}
          aria-label="French-Ward footer navigation"
        >
          <Link href="/">
            AXPT
          </Link>

          <Link href="/french-ward/transaction-intake">
            LOI / Intake
          </Link>
        </nav>

        <div className={styles.record}>
          <span>Public Institutional Record</span>
          <span>
            © {new Date().getFullYear()} French-Ward
          </span>
        </div>
      </div>
    </footer>
  )
}
