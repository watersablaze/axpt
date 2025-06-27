// ✅ app/admin/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/AdminTokens.module.css';

interface TokenLogEntry {
  partner: string;
  tier: string;
  docs: string[];
  token: string;
  issuedAt: string;
}

export default function TokenHistoryPage() {
  const [logs, setLogs] = useState<TokenLogEntry[]>([]);

  useEffect(() => {
    fetch('/api/admin/tokens/history')
      .then(res => res.json())
      .then(data => setLogs(data.tokens || []))
      .catch(err => console.error('❌ Failed to load logs:', err));
  }, []);

  return (
    <div className={styles.container}>
      <h1>📜 Issued Token History</h1>
      {logs.length === 0 ? (
        <p>No tokens issued yet.</p>
      ) : (
        <ul className={styles.tokenList}>
          {logs.map((entry, idx) => (
            <li key={idx} className={styles.tokenEntry}>
              <strong>{entry.partner}</strong> — {entry.tier} — {entry.issuedAt}<br />
              Docs: {entry.docs.join(', ')}
              <pre className={styles.tokenCode}>{entry.token}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}