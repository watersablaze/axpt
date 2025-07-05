// app/account/wallet/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then(res => res.json())
      .then(data => {
        if (!data.created) {
          fetch('/api/wallet/create', { method: 'POST' })
            .then(res => res.json())
            .then(res => setWallet(res.wallet));
        } else {
          setWallet(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>🔄 Loading your wallet...</p>;
  if (!wallet) return <p>⚠️ Could not load wallet.</p>;

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🪙 Wallet Portal</h1>
      <p><strong>Address:</strong> {wallet.address}</p>
      <p><strong>Balance:</strong> {wallet.balance} AXG</p>
    </div>
  );
}