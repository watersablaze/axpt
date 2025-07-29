'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConsentStore {
  hasAccepted: boolean;
  accept: () => void;
  reset: () => void;
}

export const useConsentStore = create<ConsentStore>()(
  persist(
    (set) => ({
      hasAccepted: false,
      accept: () => {
        console.log('[AXPT] ✅ Consent accepted');
        set({ hasAccepted: true });
      },
      reset: () => {
        console.log('[AXPT] 🌀 Consent reset');
        set({ hasAccepted: false });
      },
    }),
    {
      name: 'axpt-consent-store',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[AXPT] ❌ Consent store hydration failed:', error);
        } else {
          console.log('[AXPT] 💾 Consent store hydrated. hasAccepted:', state?.hasAccepted);
        }
      },
    }
  )
);