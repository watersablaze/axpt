// ✅ FILE: app/src/lib/utils/tokenSession.ts

/**
 * AXPT Local Token Session Utility
 * Stores, retrieves, and clears a verified token client-side using localStorage.
 * Should only be used in browser contexts.
 */

const STORAGE_KEY = 'axpt_verified_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.error('[AXPT] ❌ Failed to retrieve stored token:', err);
    return null;
  }
}

export function storeVerifiedToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch (err) {
    console.error('[AXPT] ❌ Failed to store verified token:', err);
  }
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[AXPT] ❌ Failed to clear stored token:', err);
  }
}