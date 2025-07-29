// 📁 src/lib/token/decodeToken.ts
import { jwtDecode } from 'jwt-decode';
import type { TokenPayload } from '@/types/token';

/**
 * Decodes a JWT without verifying the signature.
 * Returns the decoded TokenPayload or null on failure.
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = jwtDecode<TokenPayload>(token);
    return payload;
  } catch (err) {
    console.warn('[decodeToken] ⚠️ Invalid token format:', err);
    return null;
  }
}