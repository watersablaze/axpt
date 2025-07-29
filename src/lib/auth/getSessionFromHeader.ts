// 📁 src/lib/auth/getSessionFromHeader.ts
import type { TokenPayload } from '@/types/token';

/**
 * Extract and parse session payload from middleware-injected header.
 * Header must be set as `x-axpt-user` (case-insensitive).
 */
export function getSessionFromHeader(h: Record<string, string>): TokenPayload | null {
  const headerKey = Object.keys(h).find(
    (key) => key.toLowerCase() === 'x-axpt-user'
  );

  if (!headerKey) return null;

  const raw = h[headerKey];
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TokenPayload;
  } catch (err) {
    console.warn('[AXPT] 🔐 Failed to parse session header:', err);
    return null;
  }
}