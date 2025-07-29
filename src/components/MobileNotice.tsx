'use client';

import React from 'react';

const MobileNotice = () => {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      background: '#111',
      color: '#fff',
      borderTop: '1px solid #333'
    }}>
      <h2 style={{ marginBottom: '1rem' }}>📱 Mobile Viewer</h2>
      <p>This portal is optimized for desktop viewing.</p>
      <p>Please revisit from a larger screen for full access.</p>
    </div>
  );
};

export default MobileNotice;