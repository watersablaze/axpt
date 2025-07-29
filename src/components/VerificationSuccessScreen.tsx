// ✅ VerificationSuccessScreen.tsx
'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onComplete: () => void;
  displayName?: string;
}

const VerificationSuccessScreen: React.FC<Props> = ({ onComplete, displayName }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        padding: '4rem',
        textAlign: 'center',
        fontSize: '1.2rem',
        color: '#ededed',
      }}
    >
      <h2>✅ Welcome{displayName ? `, ${displayName}` : ''}</h2>
      <p>Verifying access...</p>
    </motion.div>
  );
};

export default VerificationSuccessScreen;