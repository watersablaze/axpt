// src/stores/useTokenStore.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TokenStore {
  token: string | null;
  decoded: any | null;
  setToken: (token: string, decoded: any) => void;
  clearToken: () => void;
  autoRefreshCheck: () => Promise<void>;
}

export const useTokenStore = create<TokenStore>()(
  persist(
    (set) => ({
      token: null,
      decoded: null,

      setToken: (token, decoded) => {
        console.log('[AXPT] 🧬 Token set:', decoded);
        set({ token, decoded });
      },

      clearToken: () => {
        console.log('[AXPT] ❌ Token cleared');
        set({ token: null, decoded: null });
      },

      autoRefreshCheck: async () => {
        console.log('[AXPT] 🔁 Auto refresh check triggered');

        const hasCookie = typeof document !== 'undefined' &&
          document.cookie.includes('axpt_session');

        if (!hasCookie) {
          console.warn('[AXPT] ⚠️ No session cookie found — skipping refresh check.');
          return;
        }

        try {
          const res = await fetch('/api/refresh-token');
          if (!res.ok) {
            console.warn('[AXPT] ❌ Session invalid or expired');
            return;
          }

          const { session } = await res.json();
          console.log('[AXPT] ✅ Session is valid:', session);
        } catch (error) {
          console.error('[AXPT] ❌ Error during auto refresh check:', error);
        }
      },
    }),
    {
      name: 'axpt-token-store',

      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[AXPT] ❌ Token store hydration failed:', error);
        } else {
          console.log('[AXPT] 💾 Token store hydrated. Token present:', !!state?.token);
        }
      },
    }
  )
);