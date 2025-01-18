'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <p>Loading...</p>; // Show a loading state while session is fetched
  }

  if (!session) {
    router.push('/login'); // Redirect unauthenticated users to login
    return null;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {session.user?.name || 'User'}!</h1>
      <p>Your email: {session.user?.email}</p>
      <button
        onClick={() => router.push('/api/auth/signout')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
}