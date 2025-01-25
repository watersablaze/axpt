'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './Settings.module.css';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    notificationPreferences: 'email',
  });

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings.');
      }
    } catch (err) {
      console.error('Settings Save Error:', err);
      alert('An error occurred while saving your settings.');
    }
  };

  return (
    <div className={styles.settingsPage}>
      <h1>Settings</h1>
      <form className={styles.settingsForm}>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
        />

        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          disabled
        />

        <label htmlFor="notificationPreferences">Notification Preferences</label>
        <select
          id="notificationPreferences"
          name="notificationPreferences"
          value={formData.notificationPreferences}
          onChange={handleInputChange}
        >
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="none">None</option>
        </select>

        <button type="button" onClick={handleSaveSettings}>
          Save Settings
        </button>
      </form>
    </div>
  );
}