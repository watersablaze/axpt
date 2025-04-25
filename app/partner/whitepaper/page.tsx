'use client';

import { useState } from 'react';
import LottieAnimation from '@/app/components/LottieAnimation';

export default function WhitepaperPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [verifiedPartner, setVerifiedPartner] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleVerify = async () => {
    if (!acceptTerms) {
      alert('Please agree to the terms and conditions.');
      return;
    }

    setStatus('verifying');

    try {
      const res = await fetch('/api/partner/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok && data.partner) {
        setStatus('success');
        setVerifiedPartner(data.partner);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-white px-4">
      <div className="pt-20">
        <LottieAnimation src="/placeholder.json" />
      </div>

      <h1 className="mt-8 text-2xl font-bold">Enter Your Access Token</h1>

      <div className="mt-4 w-full max-w-md bg-[#2a2a2a] p-6 rounded-xl shadow-lg">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Your Access Token"
          className="w-full p-3 rounded-md text-black"
        />

        <div className="mt-4 p-4 bg-[#333333] rounded-md text-sm text-gray-300 border border-gray-600">
          <h2 className="text-lg font-semibold mb-2">Access Terms & Conditions</h2>
          <p className="mb-2">
            By proceeding, you agree that the contents of this whitepaper are confidential,
            proprietary, and intended solely for your individual review as a verified partner of Axis Point Investments (AXPT.io).
          </p>
          <p className="mb-2">
            Redistribution, duplication, or sharing of this document or its content in any form
            without explicit written permission is strictly prohibited.
          </p>
          <div className="flex items-center mt-3">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="acceptTerms">
              I agree to the terms and conditions stated above.
            </label>
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={status === 'verifying'}
          className={`mt-4 w-full ${
            acceptTerms ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-500 cursor-not-allowed'
          } text-white py-2 rounded-md transition-all`}
        >
          {status === 'verifying' ? 'Verifying...' : 'Access Whitepaper'}
        </button>

        {status === 'error' && (
          <p className="mt-2 text-red-400">Invalid token. Please try again.</p>
        )}
      </div>

      {status === 'success' && verifiedPartner && (
        <div className="mt-6 w-full max-w-4xl text-lg text-emerald-400">
          ✅ Welcome, {verifiedPartner}! You now have exclusive access.
          <div className="mt-6 w-full">
            <iframe
              src="/whitepaper/AXPT-Whitepaper.pdf"
              className="w-full h-[80vh] border border-gray-700 rounded-lg shadow-lg"
              title="AXPT.io Partner Whitepaper"
            />
          </div>
        </div>
      )}
    </div>
  );
}