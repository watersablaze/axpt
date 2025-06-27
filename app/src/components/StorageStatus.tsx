'use client';

import React from 'react';

interface StorageStatusProps {
  onStorageCleared: () => void;
}

const StorageStatus: React.FC<StorageStatusProps> = ({ onStorageCleared }) => {
  const handleClear = () => {
    localStorage.clear();
    onStorageCleared();
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      <button
        onClick={handleClear}
        style={{
          backgroundColor: '#f00',
          color: 'white',
          padding: '8px 12px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Clear Storage
      </button>
    </div>
  );
};

export default StorageStatus;