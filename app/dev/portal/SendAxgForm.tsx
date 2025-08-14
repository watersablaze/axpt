'use client';

import { useState } from 'react';

export default function SendAxgForm() {
  const [toEmail, setToEmail] = useState('resident.b@example.com');
  const [amount, setAmount] = useState('10');
  const [note, setNote] = useState('Sandbox transfer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail, amount: parseFloat(amount), note }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Transfer failed');
      setMessage('✅ Transfer complete');
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        placeholder="Recipient email"
        value={toEmail}
        onChange={e => setToEmail(e.target.value)}
        className="w-full rounded bg-black/30 px-3 py-2 text-sm border border-zinc-700"
      />
      <input
        type="number"
        step="0.01"
        placeholder="Amount (AXG)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="w-full rounded bg-black/30 px-3 py-2 text-sm border border-zinc-700"
      />
      <input
        type="text"
        placeholder="Optional note"
        value={note}
        onChange={e => setNote(e.target.value)}
        className="w-full rounded bg-black/30 px-3 py-2 text-sm border border-zinc-700"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-purple-600 hover:bg-purple-700 px-3 py-2 text-sm"
      >
        {loading ? 'Sending…' : 'Send AXG'}
      </button>
      {message && <p className="text-xs mt-1">{message}</p>}
    </form>
  );
}