// app/src/components/shared/DocCard.tsx
'use client';

import Link from 'next/link';
import styles from './DocCard.module.css';

interface DocCardProps {
  docName: string;
}

export default function DocCard({ docName }: DocCardProps) {
  const href = `/docs/${encodeURIComponent(docName)}`;
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.inner}>
        <span className={styles.icon}>📄</span>
        <span className={styles.label}>{docName.replace('.pdf', '')}</span>
      </div>
    </Link>
  );
}
