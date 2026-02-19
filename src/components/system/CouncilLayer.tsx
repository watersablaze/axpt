'use client';

import { useEffect } from 'react';
import styles from './CouncilLayer.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CouncilLayer({ open, onClose }: Props) {

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  // ESC close
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  return (
    <div className={`${styles.layer} ${open ? styles.open : ''}`}>
      <div className={styles.frame}>

        {/* LEFT RAIL */}
        <aside className={styles.sideNav}>
          <div className={styles.navHeader}>COUNCIL</div>

          <button className={`${styles.navItem} ${styles.active}`}>
            Verification
          </button>

          <button className={styles.navItem}>
            Members
          </button>

          <button className={styles.navItem}>
            Logs
          </button>

          <div className={styles.navFooter}>
            <button onClick={onClose}>Exit Chamber</button>
          </div>
        </aside>

        {/* MAIN PANEL */}
        <main className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            Verification Portal
            <span className={styles.sessionDot} />
          </div>

          <div className={styles.terminal}>
            <input placeholder="Council Key" />
            <button className="axpt-btn">Enter</button>
          </div>
        </main>

      </div>
    </div>
  );
}