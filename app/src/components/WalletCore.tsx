// 📂 src/components/WalletCore.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function WalletCore() {
  const [balance, setBalance] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 py-10 bg-black text-white"
    >
      <h1 className="text-3xl font-bold mb-6">AXPT Wallet Core</h1>

      {/* Connection Status */}
      <div className="mb-4">
        <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        <button
          onClick={() => setIsConnected(!isConnected)}
          className="mt-2 px-4 py-2 bg-teal-600 rounded hover:bg-teal-700"
        >
          {isConnected ? 'Disconnect' : 'Connect Wallet'}
        </button>
      </div>

      {/* Balance */}
      {isConnected && (
        <div className="mt-4 text-center">
          <p className="text-lg">Balance:</p>
          <p className="text-2xl font-mono text-lime-300">{balance} AXG</p>
        </div>
      )}

      {/* Placeholder for further portal elements */}
      <div className="mt-10 text-gray-400 text-sm">
        <p>Transaction history, staking, and swap features coming soon.</p>
      </div>
    </motion.div>
  );
}
