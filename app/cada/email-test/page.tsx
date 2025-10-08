// src/app/cada/email-test/page.tsx
'use client';

import { useState } from 'react';

export default function CadaEmailTestPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [response, setResponse] = useState<string>('');

  const handleSendTest = async () => {
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
        setResponse(`❌ Failed to send: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus('error');
      setResponse('❌ Network or server error.');
    }
  };

  return (
    <main className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">CADA Email Test Tool</h1>
      <p className="mb-2 text-gray-600">Send a test CADA welcome email to verify rendering + backend delivery.</p>

      <div className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Enter test email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        />
        <button
          onClick={handleSendTest}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Sending...' : 'Send Test Email'}
        </button>
        {response && <p className="text-sm mt-2">{response}</p>}
      </div>
    </main>
  );
}