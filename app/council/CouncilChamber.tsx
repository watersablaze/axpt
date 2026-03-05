'use client';

import styles from './CouncilPage.module.css';
import { useState } from 'react';

export default function CouncilChamber({
  session,
}: {
  session: { iat: number; exp: number };
}) {
  const [collapsed, setCollapsed] = useState(false);

  const issued = new Date(session.iat).toLocaleString();
  const expires = new Date(session.exp).toLocaleString();

  return (
    <div className={styles.layer}>
      <div className={styles.frame}>
        <aside className={styles.sideNav}>
          <div className={styles.navHeader}>COUNCIL NAV</div>
          <button className={styles.navItem}>Mandates</button>
          <button className={styles.navItem}>Ledger</button>
          <button className={styles.navItem}>Session</button>

          <div className={styles.navFooter}>
            <div>Issued: {issued}</div>
            <div>Expires: {expires}</div>
          </div>
        </aside>

        <main className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            Verification Portal
            <span className={styles.sessionDot} />
          </div>

          <div
            className={`${styles.terminalLine} ${
              collapsed ? styles.collapsed : ''
            }`}
            onClick={() => setCollapsed(!collapsed)}
          >
            <span className={styles.prompt}>AXPT://SESSION</span>
            <span className={styles.status}>
              Council Seat Verified
            </span>
          </div>

          <div className={styles.chamberBody}>
            {/* Chamber content */}
          </div>
        </main>
      </div>
    </div>
  );
}