'use client';

import { useEffect, useState } from 'react';
import { clearStoredToken } from '@/lib/utils/tokenSession';

export default function LogoutButton() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const hasToken = localStorage.getItem('axpt_verified_token');
    const hasCookie = document.cookie.includes('axpt_session');
    setHasSession(Boolean(hasToken || hasCookie));
  }, []);

  const handleLogout = async () => {
    clearStoredToken();

    try {
      await fetch('/api/logout');
    } catch {
      // soft fail — token-only flow
    }

    window.location.href = '/logged-out';
  };

  return hasSession ? (
    <button onClick={handleLogout} className="text-sm text-purple-400 hover:underline">
      Logout
    </button>
  ) : null;
}