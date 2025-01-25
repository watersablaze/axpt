'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    industry: '', // Placeholder for industry
    interests: '', // Placeholder for interests
  });

  if (status === 'loading') {
    return <p className={styles.loading}>Loading...</p>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Submit updated data to API
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        setIsEditing(false);
      } else {
        alert('Failed to update profile.');
      }
    } catch (err) {
      console.error('Profile Update Error:', err);
      alert('An error occurred while updating your profile.');
    }
  };

  return (
    <div className={styles.profilePage}>
      <h1>Your Profile</h1>
      <div className={styles.profileDetails}>
        <label>Name:</label>
        {isEditing ? (
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        ) : (
          <p>{formData.name}</p>
        )}

        <label>Email:</label>
        <p>{formData.email}</p>

        <label>Industry:</label>
        {isEditing ? (
          <select
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
          >
            <option value="">Select your industry</option>
            <option value="finance">Finance</option>
            <option value="technology">Technology</option>
            <option value="education">Education</option>
            <option value="healthcare">Healthcare</option>
            <option value="other">Other</option>
          </select>
        ) : (
          <p>{formData.industry || 'Not set'}</p>
        )}

        <label>Core Interests:</label>
        {isEditing ? (
          <select
            name="interests"
            value={formData.interests}
            onChange={handleInputChange}
          >
            <option value="">Select your interests</option>
            <option value="sustainability">Sustainability</option>
            <option value="blockchain">Blockchain</option>
            <option value="investment">Investment</option>
            <option value="culturalExchange">Cultural Exchange</option>
          </select>
        ) : (
          <p>{formData.interests || 'Not set'}</p>
        )}
      </div>
      <div className={styles.actions}>
        {isEditing ? (
          <button onClick={handleSave}>Save</button>
        ) : (
          <button onClick={handleEditToggle}>Edit Profile</button>
        )}
        <button onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  );
}