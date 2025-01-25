'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './Settings.module.css';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className={styles.settingsPage}>
      <h1>Settings</h1>
      <h2>Account Preferences</h2>
      <div className={styles.preference}>
        <label>Email Notifications:</label>
        <input type="checkbox" defaultChecked />
      </div>
      <div className={styles.preference}>
        <label>Two-Factor Authentication:</label>
        <input type="checkbox" />
      </div>
      <div className={styles.actions}>
        <button onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  );
}