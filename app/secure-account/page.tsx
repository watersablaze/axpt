'use client';

import { useState } from 'react';

export default function SecureAccountPage() {
  const [step, setStep] = useState<'choice' | 'password' | 'pin'>('choice');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState('');

  const handleSecure = async (type: 'password' | 'pin') => {
    const value = type === 'password' ? password : pin;
    const res = await fetch('/api/users/set-secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [type]: value }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus(`✅ ${type === 'pin' ? 'PIN' : 'Password'} saved. You’re secured!`);
    } else {
      setStatus(`❌ ${data.error}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      {step === 'choice' && (
        <>
          <h2 className="text-xl font-bold mb-4">Secure Your Account</h2>
          <button className="w-full mb-3 p-2 bg-black text-white" onClick={() => setStep('password')}>Set a Password</button>
          <button className="w-full p-2 border" onClick={() => setStep('pin')}>Set a PIN</button>
        </>
      )}

      {step === 'password' && (
        <>
          <h3 className="font-semibold mb-2">Create Password</h3>
          <input
            type="password"
            className="w-full p-2 border mb-3"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="New password"
          />
          <button className="w-full bg-green-600 text-white p-2" onClick={() => handleSecure('password')}>
            Save Password
          </button>
        </>
      )}

      {step === 'pin' && (
        <>
          <h3 className="font-semibold mb-2">Create PIN</h3>
          <input
            type="number"
            inputMode="numeric"
            maxLength={6}
            className="w-full p-2 border mb-3"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="4–6 digit PIN"
          />
          <button className="w-full bg-blue-600 text-white p-2" onClick={() => handleSecure('pin')}>
            Save PIN
          </button>
        </>
      )}

      {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}
    </div>
  );
}