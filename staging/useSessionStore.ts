// ✅ FILE: app/src/stores/useSessionStore.ts

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SessionPayload } from '@/types/auth'; // ✅

interface SessionStore {
  session: SessionPayload | null;
  setSession: (session: SessionPayload) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'axpt-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// ❗ Optionally sync across tabs using 'storage' event
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'axpt-session') {
      const newSession = JSON.parse(e.newValue || 'null')?.state?.session || null;
      useSessionStore.setState({ session: newSession });
    }
  });
}