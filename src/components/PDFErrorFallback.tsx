// components/PDFErrorFallback.tsx
'use client';

import React from 'react';
import styles from './PDFErrorFallback.module.css';

export default function PDFErrorFallback({ message }: { message: string }) {
  return (
    <div className={styles.fallbackWrapper}>
      <h2 className={styles.title}>⚠️ Document Error</h2>
      <p className={styles.message}>{message}</p>
      <p className={styles.tip}>
        Please ensure your token is valid, and that you are authorized to view this document.
      </p>
    </div>
  );
}