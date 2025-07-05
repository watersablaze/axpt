'use client';

import Link from 'next/link';
import styles from './DocCard.module.css';

export interface DocCardProps {
  filename: string;
  token?: string;
  folder?: string;
  visible?: boolean;
}

const docMeta: Record<string, { title: string; subtitle: string }> = {
  'AXPT-Whitepaper.pdf': {
    title: 'AXPT Whitepaper',
    subtitle: 'Foundational Principles & Digital Architecture',
  },
  'CIM_Chinje.pdf': {
    title: 'CIM: Chinje Region',
    subtitle: 'Regional Economic Overview and Community Impact',
  },
  'Hemp_Ecosystem.pdf': {
    title: 'Hemp Ecosystem',
    subtitle: 'Sustainable Agriculture & Resource Strategy',
  },
};

const filenameToKeyMap: Record<string, string> = {
  'AXPT-Whitepaper.pdf': 'AXPT-Whitepaper',
  'Hemp_Ecosystem.pdf': 'Hemp_Ecosystem',
  'CIM_Chinje.pdf': 'CIM_Chinje',
};

export default function DocCard({
  filename,
  token = '',
  folder = 'AXPT',
  visible = true,
}: DocCardProps) {
  const { title, subtitle } = docMeta[filename] || {
    title: filename.replace('.pdf', ''),
    subtitle: 'Access this document for more insights.',
  };

  const docKey = filenameToKeyMap[filename] || filename.replace('.pdf', '');
  const viewHref = `/vault/${docKey}?token=${token}`;

  return (
    <div className={`${styles.terminalCard} ${visible ? styles.visible : ''}`}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.subtitle}>{subtitle}</p>
      <div className={styles.actionButtons}>
        <Link href={viewHref} className={styles.viewButton}>
          View
        </Link>
      </div>
    </div>
  );
}