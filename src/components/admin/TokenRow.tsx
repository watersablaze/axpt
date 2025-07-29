// ✅ FILE: app/src/components/admin/TokenRow.tsx

'use client';

import React, { useState } from 'react';
import styles from './TokenRow.module.css';
import { TokenPayload } from '@/types/token';

export interface TokenRowProps {
  token: TokenPayload & {
    tokenString?: string;
    qrPath?: string;
  };
}

export default function TokenRow({ token }: TokenRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.tokenRowContainer}>
      <div className={styles.tokenRow}>
        <div className={styles.tokenRowItem}>
          <span className={styles.tokenRowLabel}>Partner:</span>
          <span className={styles.tokenRowValue}>{token.partner}</span>
        </div>
        <div className={styles.tokenRowItem}>
          <span className={styles.tokenRowLabel}>Tier:</span>
          <span className={styles.tokenRowValue}>{token.tier}</span>
        </div>
        <div className={styles.tokenRowItem}>
          <span className={styles.tokenRowLabel}>Docs:</span>
          <span className={styles.tokenRowValue}>{token.docs.join(', ')}</span>
        </div>
        <div className={styles.tokenRowItem}>
          <span className={styles.tokenRowLabel}>Issued:</span>
          <span className={styles.tokenRowValue}>
            {token.iat ? new Date(token.iat * 1000).toLocaleString() : '—'}
          </span>
        </div>

        <button
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide Details ▲' : 'Show Details ▼'}
        </button>
      </div>

      {expanded && (
        <div className={styles.tokenDetailsPanel}>
          <pre><strong>Raw Token:</strong>{'\n'}{token.tokenString || '[Unavailable]'}</pre>
          <pre><strong>Decoded Payload:</strong>{'\n'}{JSON.stringify(token, null, 2)}</pre>
          {token.qrPath && (
            <div className={styles.qrSection}>
              <strong>QR Code:</strong>
              <br />
              <img src={`/qr/${token.partner}.png`} alt="QR Code" style={{ maxWidth: '200px' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}