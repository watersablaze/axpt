'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <p className={styles.loading}>Loading...</p>; // Loading state
  }

  if (!session) {
    router.push('/login'); // Redirect unauthenticated users
    return null;
  }

  const handleLogout = async () => {
    await router.push('/api/auth/signout');
  };

  return (
    <div className={styles.dashboard}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <h1>Welcome Back, {session.user?.name || 'User'}!</h1>
        <p>Your email: {session.user?.email}</p>
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        <button
          className={styles.linkButton}
          onClick={() => router.push('/profile')}
        >
          Profile
        </button>
        <button
          className={styles.linkButton}
          onClick={() => router.push('/wallet')}
        >
          Wallet
        </button>
        <button
          className={styles.linkButton}
          onClick={() => router.push('/settings')}
        >
          Settings
        </button>
        <button
          className={styles.logoutButton}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Activity Summary */}
      <div className={styles.activitySection}>
        <h2>Recent Activity</h2>
        <ul>
          <li>Viewed Wallet - 2 hours ago</li>
          <li>Updated Profile - 1 day ago</li>
          <li>Signed in - 3 days ago</li>
        </ul>
      </div>
    </div>
  );
}