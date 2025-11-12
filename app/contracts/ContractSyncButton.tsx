'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import styles from './ContractsPage.module.css';
import { useMirrorIntensity } from '@/lib/context/MirrorIntensityContext';

export function ContractSyncButton() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const { setIntensity } = useMirrorIntensity();

async function handleSync() {
  setLoading(true);
  toast.info('Syncing contracts...');
  setIntensity(2); // ✨ temporarily intensify

  try {
    const res = await fetch('/api/contracts/sync', { method: 'POST' });
    const data = await res.json();
    toast.success('Sync complete');
  } catch (err) {
    toast.error('Error syncing');
  } finally {
    // fade back to baseline
    setTimeout(() => setIntensity(1), 5000);
    setLoading(false);
  }
}

  return (
    <div className={styles.syncPanel}>
      <button onClick={handleSync} disabled={loading} className={styles.syncBtn}>
        {loading ? 'Syncing…' : 'Run Chain Sync'}
      </button>

      {results && (
        <div className={styles.syncResults}>
          <h3>Sync Results</h3>
          <table>
            <thead>
              <tr>
                <th>Contract</th>
                <th>Address</th>
                <th>Verified</th>
                <th>Block</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>
                    <code>{r.address?.slice(0, 8)}...{r.address?.slice(-6)}</code>
                  </td>
                  <td>{r.verified ? '✅' : '❌'}</td>
                  <td>{r.block ?? '—'}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}