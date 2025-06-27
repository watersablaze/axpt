'use client';

import { useState } from 'react';

export default function UpgradeAccountForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch('/api/bridge/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, pin }),
      });

      const data = await res.json();
      if (!data.success) {
        setStatus('error');
        setError(data.error);
        return;
      }

      setStatus('success');
      window.location.href = '/account/dashboard';
    } catch (err) {
      console.error('[UpgradeAccountForm] Error:', err);
      setStatus('error');
      setError('Network error. Try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Upgrade to Full Account</h2>
      <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Choose PIN" value={pin} onChange={(e) => setPin(e.target.value)} required />
      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? '⏳ Upgrading...' : '🚀 Upgrade'}
      </button>
      {status === 'error' && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}