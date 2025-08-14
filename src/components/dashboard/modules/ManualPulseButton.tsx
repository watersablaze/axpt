'use client';

import { useState } from 'react';
import styles from './ManualPulseButton.module.css';

export function ManualPulseButton({ onPulseSuccess }: { onPulseSuccess: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleManualPing = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/db-monitor-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage('✅ Pulse sent.');
        onPulseSuccess(); // refresh logs
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(`❌ ${err.message}`);
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 4000);
    }
  };

  return (
    <div className={styles.pulseContainer}>
      <button className={styles.pulseButton} onClick={handleManualPing} disabled={status === 'loading'}>
        {status === 'loading' ? '🔄 Pinging...' : '📡 Manual Pulse'}
      </button>
      {message && <p className={styles.pulseMessage}>{message}</p>}
    </div>
  );
}