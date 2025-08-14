// 📁 src/lib/token/decodeToken.ts
import { jwtDecode } from 'jwt-decode';
import type { SessionPayload } from '@/types/auth';

const validTiers: SessionPayload['tier'][] = [
  'Investor', 'Partner', 'Farmer', 'Merchant', 'Nomad', 'Board',
];

/**
 * Decodes a JWT without verifying the signature.
 * Ensures 'tier' is valid and casts to SessionPayload.
 */
export function decodeToken(token: string): SessionPayload | null {
  try {
    const decoded = jwtDecode<any>(token);

    if (!decoded?.tier || !validTiers.includes(decoded.tier)) {
      console.warn('[AXPT] ⚠️ Invalid or missing tier in token:', decoded.tier);
      return null;
    }

    return decoded as SessionPayload;
  } catch (err) {
    console.error('❌ Token decoding failed:', err);
    return null;
  }
}