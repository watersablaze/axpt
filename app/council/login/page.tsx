'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../CouncilPage.module.css';

export default function CouncilLogin() {
  const router = useRouter();

  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/council/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError('Invalid Council Key');
        setLoading(false);
        return;
      }

      router.push('/council');

    } catch (err) {
      setError('System error');
      setLoading(false);
    }
  };

  return (
    <div className={styles.layer}>
      <div className={styles.frameCentered}>
        <div className={styles.loginPanel}>
          <div className={styles.panelHeader}>
            Council Authentication
            <span className={styles.sessionDotIdle} />
          </div>

          <div className={styles.terminal}>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Council Key"
            />
            <button
              onClick={handleSubmit}
              className={styles.enterButton}
              disabled={loading}
            >
              {loading ? 'Validating…' : 'Enter'}
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}