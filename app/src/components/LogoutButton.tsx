'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise(res => setTimeout(res, 500)); // Optional delay
    router.push('/logged-out');
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-6 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition"
    >
      🔒 Logout
    </button>
  );
}