'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LogoutButton() {
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hasToken = localStorage.getItem('axpt_verified_token');
    const hasCookie = document.cookie.includes('axpt_session');
    setHasSession(Boolean(hasToken || hasCookie));
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/clear-session', {
        method: 'POST',
      });

      if (res.ok) {
        localStorage.removeItem('axpt_verified_token');
        toast.success('Logged out successfully.');
      } else {
        toast.error('Failed to clear session.');
      }

      router.push('/logged-out');
    } catch (err) {
      toast.error('Logout failed.');
      console.error('[AXPT] Logout error:', err);
    }
  };

  return hasSession ? (
    <button
      onClick={handleLogout}
      className="text-sm text-purple-400 hover:underline"
    >
      Logout
    </button>
  ) : null;
}