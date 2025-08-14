'use client';
import { useState } from 'react';

export default function TransferForm() {
  const [email, setEmail] = useState('resident.b@example.com');
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState('');

  const send = async () => {
    const res = await fetch('/api/wallet/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toEmail: email, amount, note }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      alert(`Transfer failed: ${data.error || res.statusText}`);
      return;
    }
    alert('Sent!');
    // Soft-refresh
    if (typeof window !== 'undefined') window.location.reload();
  };

  return (
    <div className="space-y-2">
      <input
        placeholder="Recipient Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded px-3 py-2 text-black"
      />
      <input
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value))}
        className="w-full rounded px-3 py-2 text-black"
      />
      <input
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded px-3 py-2 text-black"
      />
      <button onClick={send} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-white">
        Send AXG
      </button>
    </div>
  );
}