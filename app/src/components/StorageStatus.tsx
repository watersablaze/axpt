import React, { useState, useEffect } from 'react';

interface StorageStatusProps {
  onStorageCleared?: () => void; // ✅ Soft reset callback
}

const StorageStatus: React.FC<StorageStatusProps> = ({ onStorageCleared }) => {
  const [verifiedPartner, setVerifiedPartner] = useState<string | null>(null);
  const [preVerified, setPreVerified] = useState<string | null>(null);
  const [clearedMessage, setClearedMessage] = useState(false);

  const envMode = process.env.NODE_ENV || 'development';

  const readStorage = () => {
    setVerifiedPartner(localStorage.getItem('verifiedPartner'));
    setPreVerified(localStorage.getItem('preVerified'));
  };

  const handleClearStorageWithRefresh = () => {
    localStorage.removeItem('verifiedPartner');
    localStorage.removeItem('preVerified');
    window.location.reload(); // ✅ Full page reload
  };

  const handleResetSessionNoReload = () => {
    localStorage.removeItem('verifiedPartner');
    localStorage.removeItem('preVerified');
    if (onStorageCleared) {
      onStorageCleared(); // ✅ Triggers React state reset
    }
    readStorage(); // Optional: updates debug box

     // 🟢 Add this log for visibility:
  console.log('✅ Session reset triggered. Storage cleared and state reset.');

  // Optional: confirm what’s in localStorage after clearing:
  console.log('Storage status after reset:', {
    verifiedPartner: localStorage.getItem('verifiedPartner'),
    preVerified: localStorage.getItem('preVerified'),
  });
  
    setClearedMessage(true);
    setTimeout(() => setClearedMessage(false), 2000); // Auto-hide message
  };

  useEffect(() => {
    readStorage();
  }, []);

  if (envMode === 'production') {
    return null; // 🛑 Hide completely in production
  }

  return (
    <div
      style={{
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
      }}
    >
      <strong>Storage Debug (DEV ONLY):</strong>
      <div>verifiedPartner: {verifiedPartner || 'null'}</div>
      <div>preVerified: {preVerified || 'null'}</div>

      <button
        onClick={handleClearStorageWithRefresh}
        style={{
          marginTop: '10px',
          padding: '4px 8px',
          fontSize: '0.8rem',
          background: '#ff3366',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        🗑️ Clear Storage & Refresh Page
      </button>

      <button
        onClick={handleResetSessionNoReload}
        style={{
          marginTop: '6px',
          padding: '4px 8px',
          fontSize: '0.8rem',
          background: '#00b7ff',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        🔄 Reset Session (No Reload)
      </button>

      <p style={{ color: '#aaa', fontSize: '0.7rem', marginTop: '6px' }}>
        “Reset Session” clears the current partner state and returns to the pre-verification screen without reloading the browser.
      </p>

      {clearedMessage && (
        <div
          style={{
            marginTop: '10px',
            backgroundColor: '#00ffc6',
            color: '#000',
            padding: '4px 6px',
            borderRadius: '4px',
            textAlign: 'center',
            fontSize: '0.75rem',
          }}
        >
          ✅ Storage cleared!
        </div>
      )}
    </div>
  );
};

export default StorageStatus;