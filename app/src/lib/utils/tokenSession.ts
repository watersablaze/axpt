// tokenSession.ts
const KEY = 'axpt_verified_token';

export function storeVerifiedToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, token);
  }
}

export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(KEY);
  }
  return null;
}

export function clearStoredToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KEY);
  }
}