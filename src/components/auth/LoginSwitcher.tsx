'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginSwitcher() {
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: secret }),
    });

    const data = await res.json();
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError(data.error || 'Login failed');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Login with {mode === 'password' ? 'Password' : 'PIN'}</h2>

      <div className="mb-4 flex justify-between text-sm">
        <button
          onClick={() => setMode('password')}
          className={`px-3 py-1 rounded ${mode === 'password' ? 'bg-black text-white' : 'border'}`}
        >
          Password
        </button>
        <button
          onClick={() => setMode('pin')}
          className={`px-3 py-1 rounded ${mode === 'pin' ? 'bg-black text-white' : 'border'}`}
        >
          PIN
        </button>
      </div>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />
      <input
        type={mode === 'password' ? 'password' : 'number'}
        placeholder={mode === 'password' ? 'Password' : 'PIN'}
        value={secret}
        onChange={e => setSecret(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <button
        onClick={handleLogin}
        className="w-full bg-black text-white p-2 rounded hover:bg-gray-800"
      >
        Log In
      </button>

      {error && <p className="text-red-500 mt-3">{error}</p>}
    </div>
  );
}