'use client';

import React, { useState, useEffect } from 'react';
import { resetAcrossTabs } from '@/lib/utils/resetAcrossTabs';

interface StorageStatusProps {
  onStorageCleared?: () => void;
}

const StorageStatus: React.FC<StorageStatusProps> = ({ onStorageCleared }) => {
  const [verifiedPartner, setVerifiedPartner] = useState<string | null>(null);
  const [preVerified, setPreVerified] = useState<string | null>(null);
  const [clearedMessage, setClearedMessage] = useState(false);

  const envMode = process.env.NODE_ENV || 'development';

  const readStorage = () => {
    setVerifiedPartner(typeof localStorage !== 'undefined' ? localStorage.getItem('verifiedPartner') : null);
    setPreVerified(typeof localStorage !== 'undefined' ? localStorage.getItem('preVerified') : null);
  };

  const handleClearStorageWithRefresh = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('verifiedPartner');
      localStorage.removeItem('preVerified');
    }
    resetAcrossTabs(); // 🧠 Sync reset across tabs
    window.location.reload(); // 🔁 Full reload
  };

  const handleResetSessionNoReload = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('verifiedPartner');
      localStorage.removeItem('preVerified');
    }
    resetAcrossTabs(); // 🔄 Sync across open tabs

    if (onStorageCleared) {
      onStorageCleared(); // Trigger parent state reset
    }

    readStorage(); // Re-check local state
    console.log('✅ Session reset triggered across tabs.');

    setClearedMessage(true);
    setTimeout(() => setClearedMessage(false), 2000);
  };

  useEffect(() => {
    readStorage();

    const channel = new BroadcastChannel('axpt-storage');
    channel.onmessage = (e) => {
      if (e.data?.type === 'forceReset') {
        console.log('🔄 Detected reset from another tab.');
        if (onStorageCleared) onStorageCleared();
        readStorage();
      }
    };

    return () => channel.close();
  }, []);

  if (envMode === 'production') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.85)',
      color: '#00ffc6',
      padding: '12px',
      fontFamily: 'Fira Code, monospace',
      fontSize: '0.85rem',
      borderRadius: '8px',
      zIndex: 9999,
      maxWidth: '260px',
    }}>
      <strong>Storage Debug (DEV ONLY):</strong>
      <div>verifiedPartner: {verifiedPartner || 'null'}</div>
      <div>preVerified: {preVerified || 'null'}</div>

      <button onClick={handleClearStorageWithRefresh} style={{
        marginTop: '10px',
        padding: '4px 8px',
        fontSize: '0.8rem',
        background: '#ff3366',
        border: 'none',
        borderRadius: '4px',
        color: '#fff',
        cursor: 'pointer',
        width: '100%',
      }}>
        🗑️ Clear Storage & Refresh Page
      </button>

      <button onClick={handleResetSessionNoReload} style={{
        marginTop: '6px',
        padding: '4px 8px',
        fontSize: '0.8rem',
        background: '#00b7ff',
        border: 'none',
        borderRadius: '4px',
        color: '#fff',
        cursor: 'pointer',
        width: '100%',
      }}>
        🔄 Reset Session (No Reload)
      </button>

      <p style={{ color: '#aaa', fontSize: '0.7rem', marginTop: '6px' }}>
        “Reset Session” clears the current partner state and returns to the pre-verification screen without reloading.
      </p>

      {clearedMessage && (
        <div style={{
          marginTop: '10px',
          backgroundColor: '#00ffc6',
          color: '#000',
          padding: '4px 6px',
          borderRadius: '4px',
          textAlign: 'center',
          fontSize: '0.75rem',
        }}>
          ✅ Storage cleared!
        </div>
      )}
    </div>
  );
};

export default StorageStatus;