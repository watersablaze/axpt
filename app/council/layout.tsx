import styles from './CouncilPage.module.css';
import Link from 'next/link';

export default function CouncilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layer}>
      <div className={styles.frame}>

        <aside className={styles.sideNav}>
          <div className={styles.navHeader}>COUNCIL</div>

          <Link href="/council" className={styles.navItem}>
            Verification
          </Link>

          <Link href="/council/members" className={styles.navItem}>
            Members
          </Link>

          <Link href="/council/logs" className={styles.navItem}>
            Logs
          </Link>

          <div className={styles.navFooter}>
        <form action="/api/council/seal" method="POST">
        <button className={styles.sealButton}>
       Commence
      </button>
       </form>
            AXPT Secure Surface
          </div>

        </aside>

        <main className={styles.mainPanel}>
          {children}
        </main>

      </div>
    </div>
  );
}