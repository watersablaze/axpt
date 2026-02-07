// app/login/pin/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    const res = await fetch('/api/auth/login-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      router.push(data.redirectTo || '/account/dashboard');
    } else {
      setError(data.error || 'Invalid PIN');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24 p-6 rounded-xl shadow-lg bg-gradient-to-b from-black via-gray-900 to-black text-white animate-fade-in">
      <h1 className="text-2xl font-bold mb-4 text-center">🔐 Enter Your PIN</h1>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="password"
          maxLength={6}
          inputMode="numeric"
          className="w-full p-3 rounded border border-purple-600 bg-black text-white text-center tracking-widest text-xl mb-4"
          placeholder="******"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-purple-700 hover:bg-purple-800 transition p-3 rounded-lg font-semibold"
        >
          🔓 Unlock
        </button>
      </form>
      {error && <p className="text-red-400 mt-3 text-sm text-center">{error}</p>}
    </div>
  );
}