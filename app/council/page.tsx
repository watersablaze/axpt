'use client';

import styles from './CouncilPage.module.css';
import { useState } from 'react';

export default function CouncilPage() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
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
        {/* Future chamber content goes here */}
      </div>
    </>
  );
}