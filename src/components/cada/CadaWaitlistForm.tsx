'use client';

import { useState } from 'react';

export default function CadaWaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage(null);

    try {
      const res = await fetch('/api/cada/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage('✅ Welcome to CADA! Check your inbox for confirmation.');
      setEmail(''); // Reset field
    } catch (err) {
      console.error('💥 Submit error:', err);
      setStatus('error');
      setMessage('Server error. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <label htmlFor="email" className="block font-medium text-white">
        Enter your email to join the CADA Waitlist
      </label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === 'loading'}
        placeholder="you@example.com"
        className="w-full p-2 border border-gray-300 rounded-md text-black"
      />

      <button
        type="submit"
        disabled={status === 'loading'}
        className={`px-4 py-2 rounded-md w-full ${
          status === 'loading' ? 'bg-gray-400' : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {status === 'loading' ? 'Sending...' : 'Join the Waitlist'}
      </button>

      {message && (
      <p
        className={`text-sm mt-2 ${
          status === 'success' ? 'text-green-200' : 'text-red-400'
        }`}
      >
        {message}
      </p>
      )}
    </form>
  );
}