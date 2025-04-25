// app/partner/whitepaper.tsx
'use client';

import { useEffect, useState } from "react";
import styles from "./Whitepaper.module.css";
import Lottie from "lottie-react";
import axptSigil from "@/public/lottie/axpt_sigil.json"; // Adjust the path as needed

export default function WhitepaperPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleVerify = async () => {
    setStatus('verifying');
    const res = await fetch('/api/partner/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token, email }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (data.success) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="fade-in">
        <h1>Welcome, Partner.</h1>
        <p>The whitepaper awaits.</p>
        {/* Embed iframe or directly display the content here */}
      </div>
    );
  }

  return (
    <div className="verification-container">
      <h2>Enter Your Access Key</h2>
      <input
        type="text"
        placeholder="Enter your key"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button onClick={handleVerify}>Verify & Enter</button>
      {status === 'error' && <p className="error">Invalid token. Please check and try again.</p>}
    </div>
  );
}