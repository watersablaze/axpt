'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InitiationForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('investor'); // or "creative", etc.

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/submit/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, role }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(data.redirect || '/portal/initiation');
      } else {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
      }
    } catch (err) {
      console.error('[FRONTEND INITIATION ERROR]', err);
      setError('Unexpected error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Your Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="investor">Investor</option>
          <option value="creative">Creative Producer</option>
          <option value="contributor">Contributor</option>
          <option value="partner">Partner</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
      >
        {loading ? 'Initiating...' : 'Initiate Entry'}
      </button>
    </form>
  );
}