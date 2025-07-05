import { create } from 'zustand';
import type { TokenPayload } from '@/types/token';

interface TokenStore {
  token: string | null;
  decoded: TokenPayload | null;
  setToken: (rawToken: string, decoded: TokenPayload) => void;
  clearToken: () => void;
}

export const useTokenStore = create<TokenStore>((set) => ({
  token: null,
  decoded: null,
  setToken: (rawToken, decoded) => {
    console.log('[AXPT] 🔐 Token stored in state:', rawToken);
    console.log('[AXPT] 🔍 Decoded payload:', decoded);
    set({ token: rawToken, decoded });
  },
  clearToken: () => {
    console.log('[AXPT] 🔄 Token state cleared.');
    set({ token: null, decoded: null });
  },
}));