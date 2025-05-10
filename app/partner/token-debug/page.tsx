// File: app/partner/token-debug/page.tsx
'use client';

import { useState } from 'react';

export default function TokenDebugPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<null | {
    valid: boolean;
    reason: string;
    payload?: any;
    expectedSig?: string;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/partner/debug-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Unknown error');
        setResult(null);
      } else {
        setResult({
          valid: data.valid,
          reason: data.reason,
          payload: data.payload,
          expectedSig: data.expectedSig
        });
      }
    } catch (err) {
      setError('Network or server error.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>🔍 Token Debugger</h1>
      <textarea
        rows={4}
        style={{ width: '100%', marginTop: '1rem', fontFamily: 'monospace' }}
        placeholder="Paste full token here..."
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button style={{ marginTop: '1rem' }} onClick={handleVerify} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Token'}
      </button>

      {error && (
        <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>
      )}

      {result && (
        <div style={{ marginTop: '2rem' }}>
          <p><strong>Status:</strong> {result.reason}</p>
          {result.payload && (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#111', color: '#0f0', padding: '1rem' }}>
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
