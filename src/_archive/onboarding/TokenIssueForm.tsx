'use client';

import { useState } from 'react';
import styles from '@/styles/AdminIssue.module.css';
import { decodeToken } from '@/lib/token/decodeToken';

export default function TokenVerifier() {
  const [inputToken, setInputToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleVerify = () => {
    setResult(null);
    setError('');

    try {
      const [payloadB64] = inputToken.split(':');
      const decoded = decodeToken(payloadB64);

      if (!decoded) {
        setError('❌ Invalid or expired token.');
      } else {
        setResult(decoded);
      }
    } catch (err) {
      console.error(err);
      setError('❌ Token verification failed.');
    }
  };

  return (
    <div className={styles.verifierBox}>
      <h2>🔍 Token Verifier</h2>
      <textarea
        className={styles.input}
        placeholder="Paste token here"
        rows={4}
        value={inputToken}
        onChange={(e) => setInputToken(e.target.value)}
      />
      <button
        onClick={handleVerify}
        className={styles.button}
        style={{ marginTop: '1rem' }}
      >
        Verify Token
      </button>

      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <div className={styles.tokenBox}>
          <strong>✅ Valid Token</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}