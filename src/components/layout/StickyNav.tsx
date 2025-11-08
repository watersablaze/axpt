// src/components/layout/StickyNav.tsx
'use client';

import Link from 'next/link';
import styles from './StickyNav.module.css';

export default function StickyNav() {
  return (
    <nav className={styles.nav}>
      <ul>
        <li><a href="#vision">Vision</a></li>
        <li><a href="#nommo">Nommo</a></li>
        <li><a href="#vault">Vault</a></li>
        <li><a href="#contracts">Contracts</a></li>
      </ul>
    </nav>
  );
}