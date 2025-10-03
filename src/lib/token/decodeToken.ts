// src/lib/token/decodeToken.ts
import { jwtDecode } from 'jwt-decode';
import type { SessionPayload } from '@/types/auth';

const valid = new Set(['Investor','Partner','Farmer','Merchant','Nomad','Board']);

export function decodeToken(token: string): SessionPayload | null {
  try {
    const d: any = jwtDecode(token);
    const tierRaw = typeof d?.tier === 'string' ? d.tier : '';
    const tierNorm =
      tierRaw.length ? tierRaw[0].toUpperCase() + tierRaw.slice(1).toLowerCase() : '';

    if (!valid.has(tierNorm)) {
      console.warn('[AXPT] Invalid tier in token:', d?.tier);
      return null;
    }
    d.tier = tierNorm; // normalize
    return d as SessionPayload;
  } catch (err) {
    console.error('[AXPT] decodeToken failed:', err);
    return null;
  }
}