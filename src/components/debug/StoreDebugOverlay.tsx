// 📁 app/components/debug/StoreDebugOverlay.tsx
'use client';

import { useConsentStore } from '@/stores/useConsentStore';
import { useTokenStore } from '@/stores/useTokenStore';
import { useEffect, useState } from 'react';

export default function StoreDebugOverlay() {
  const { hasAccepted } = useConsentStore();
  const { token, decoded } = useTokenStore();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000); // fade after 5s
    return () => clearTimeout(timer);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg z-[9999] shadow-lg max-w-xs animate-fadeout">
      <strong className="block mb-1">🧪 AXPT Zustand Debug</strong>
      <div>🟢 Consent: {hasAccepted ? 'Accepted' : 'Not accepted'}</div>
      <div>🔐 Token: {token ? `${token.slice(0, 12)}...` : 'None'}</div>
      <div>📛 Name: {decoded?.displayName ?? 'N/A'}</div>
      <div>🎖️ Tier: {decoded?.tier ?? 'N/A'}</div>
    </div>
  );
}