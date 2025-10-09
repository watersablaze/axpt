'use client';

import { useState } from 'react';
import AdminDashboardShell from '@/components/layout/AdminDashboardShell';

export default function UpgradePinnedDashboard() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [response, setResponse] = useState<string>('');

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      setResponse('Please enter a valid email.');
      return;
    }

    setStatus('sending');
    setResponse('');

    try {
      const res = await fetch('/api/cada/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('sent');
        setResponse('✅ Test email sent successfully.');
      } else {
        setStatus('error');
        setResponse(`❌ Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus('error');
      setResponse('❌ Network or server error.');
    }
  };

  return (
    <AdminDashboardShell>
      <section className="max-w-xl mx-auto p-6 bg-white rounded-md shadow space-y-4 border border-gray-200">
        <h2 className="text-2xl font-bold">Upgrade Pinned Tools</h2>
        <p className="text-gray-600">Use this tool to test the CADA welcome email and log internal responses.</p>

        <label className="block text-sm font-medium text-gray-700">
          Email Address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="mt-1 w-full px-3 py-2 border rounded-md shadow-sm text-black"
          />
        </label>

        <button
          onClick={handleSend}
          disabled={status === 'sending'}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          {status === 'sending' ? 'Sending...' : 'Send Test Email'}
        </button>

        {response && (
          <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {response}
          </p>
        )}
      </section>
    </AdminDashboardShell>
  );
}