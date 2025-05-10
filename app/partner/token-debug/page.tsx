'use client';

import { useState } from 'react';

export default function TokenDebugPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<null | {
    valid: boolean;
    reason: string;
    payload?: any;
    expectedSig?: string;
    displayName?: string;
    greeting?: string;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedPayload, setEditedPayload] = useState<string>('');

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/partner/debug-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Unknown error.');
      } else {
        setResult({
          valid: data.valid,
          reason: data.reason,
          payload: data.payload,
          expectedSig: data.expectedSig,
          displayName: data.displayName,
          greeting: data.greeting
        });
        setEditedPayload(JSON.stringify(data.payload, null, 2));
      }
    } catch (err) {
      setError('⚠️ Network or server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      const parsed = JSON.parse(editedPayload);
      const res = await fetch('/api/partner/debug-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: parsed })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to regenerate.');
      } else {
        setToken(`${data.encoded}:${data.signature}`);
        setResult({
          valid: true,
          reason: 'Regenerated Successfully',
          payload: parsed,
          expectedSig: data.signature,
          displayName: data.displayName,
          greeting: data.greeting
        });
      }
    } catch {
      setError('Invalid JSON in payload editor.');
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'monospace', background: '#0a0a0a', color: '#00ffcc' }}>
      <h1 style={{ fontSize: '1.5rem' }}>🔍 AXPT Token Debugger</h1>

      <textarea
        rows={4}
        style={{ width: '100%', marginTop: '1rem', fontFamily: 'monospace', padding: '0.5rem', background: '#111', color: '#0f0' }}
        placeholder="Paste full token here..."
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />

      <button
        onClick={handleVerify}
        disabled={loading || !token}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#00ffc6', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
      >
        {loading ? 'Verifying...' : 'Verify Token'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      {result?.payload && token && (
        <div style={{ marginTop: '1rem' }}>
          {result.displayName && (
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>👤 Welcome, {result.displayName}!</p>
          )}
          {result.greeting && (
            <p style={{ fontStyle: 'italic', color: '#ccc', marginBottom: '1rem' }}>{result.greeting}</p>
          )}
          <p><strong>Status:</strong> {result.valid ? '✅ Valid' : '❌ Invalid'} — {result.reason}</p>

          <h3 style={{ marginTop: '1rem' }}>📦 Editable Payload:</h3>
          <textarea
            rows={10}
            style={{ width: '100%', fontFamily: 'monospace', padding: '1rem', background: '#111', color: '#0f0' }}
            value={editedPayload}
            onChange={(e) => setEditedPayload(e.target.value)}
          />

          <button
            onClick={handleRegenerate}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#ff0', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
          >
            🔁 Regenerate Token
          </button>
        </div>
      )}
    </main>
  );
}
