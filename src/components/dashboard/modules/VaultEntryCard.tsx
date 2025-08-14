'use client';

import { ReactNode } from 'react';
import styles from './VaultEntryCard.module.css';

interface VaultEntryCardProps {
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
}

export function VaultEntryCard({ children, title, footer }: VaultEntryCardProps) {
  return (
    <div className={styles.card}>
      {title && <div className={styles.header}>{title}</div>}

      <div className={styles.body}>{children}</div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}