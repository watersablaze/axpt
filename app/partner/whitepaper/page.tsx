'use client';

import { useState, useEffect } from 'react';

export default function WhitepaperPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [verified, setVerified] = useState(false);

  // Tokens from your .env file
  const allowedTokens = [
    process.env.NEXT_PUBLIC_QUEENDOM_COLLECTIVE_TOKEN,
    process.env.NEXT_PUBLIC_RED_ROLLIN_TOKEN,
    process.env.NEXT_PUBLIC_LIMITECH_TOKEN,
    process.env.NEXT_PUBLIC_AXPT_ADMIN_TOKEN,
  ];

  const handleVerify = () => {
    setStatus('verifying');
    if (allowedTokens.includes(tokenInput.trim())) {
      setStatus('success');
      setVerified(true);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0e0e0e] text-white p-8">
      {!verified ? (
        <div className="max-w-md w-full bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-[#333]">
          <h1 className="text-2xl mb-4 font-bold">🔒 Partner Whitepaper Access</h1>
          <p className="mb-4 text-sm text-gray-300">
            Please enter your provided token to view the AXPT.io partner whitepaper.
          </p>
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Enter your key/token here..."
            className="w-full p-3 rounded-md bg-[#2a2a2a] text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] mb-4"
          />
          <button
            onClick={handleVerify}
            className="w-full bg-[#FFD700] text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-400 transition"
          >
            Verify & Enter
          </button>
          {status === 'error' && (
            <p className="mt-3 text-red-500 text-sm">❌ Invalid token. Please check and try again.</p>
          )}
        </div>
      ) : (
        <div className="w-full max-w-5xl">
          <h1 className="text-3xl mb-6 font-bold text-center">📄 AXPT.io Partner Whitepaper</h1>
          <div className="border-2 border-[#FFD700] rounded-lg overflow-hidden shadow-lg">
            <iframe
              src="/whitepaper/AXPT-Whitepaper.pdf"
              width="100%"
              height="900px"
              style={{ border: 'none' }}
              title="AXPT.io Partner Whitepaper"
            />
          </div>
          <p className="mt-4 text-sm text-center text-gray-400">
            This document is private and intended solely for your use. Please do not share or forward.
          </p>
        </div>
      )}
    </div>
  );
}