'use client';

import Link from 'next/link';
import { getDocMetaByFilename } from '@/lib/docs/getDocMeta';
import styles from './DocCard.module.css';
import { useDocVaultState } from '@/components/onboarding/useDocVaultState';

export interface DocCardProps {
  filename: string;
  token?: string;
  folder?: string;
  visible?: boolean;
  className?: string;
}

export default function DocCard({
  filename,
  token = '',
  folder = 'AXPT',
  visible = true,
  className = '',
}: DocCardProps) {
  const { setSelectedDoc } = useDocVaultState();

  const meta = getDocMetaByFilename(filename) || {
    slug: filename.replace('.pdf', ''),
    filename,
    title: filename.replace('.pdf', '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    subtitle: 'Access this document for more insights.',
    folder,
  };

  const encodedToken = encodeURIComponent(token);
  const viewHref = `/docs/${meta.slug}?token=${encodedToken}`;
  const downloadHref = `/docs/${meta.folder ?? folder}/${meta.filename}`;

  return (
    <article
      className={`${styles.card} ${visible ? styles.visible : ''} ${className}`}
      aria-label={`Document card for ${meta.title}`}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h3 className={styles.title}>{meta.title}</h3>
          <p className={styles.subtitle}>{meta.subtitle}</p>
        </header>
        <div className={styles.actions}>
          <Link href={viewHref} className={styles.viewButton}>
            View
          </Link>

        </div>
      </div>
    </article>
  );
}