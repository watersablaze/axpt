import { verifyToken } from '@/utils/token';

export interface SessionPayload {
  partner: string;
  tier: string;
  docs: string[];
  iat: number;
  exp?: number;
  token: string;
}

export function getSessionFromToken(token: string): SessionPayload | null {
  try {
    const payload = verifyToken(token);
    if (!payload) return null;

    const { partner, tier, docs, iat, exp } = payload;

    const isValid =
      typeof partner === 'string' &&
      typeof tier === 'string' &&
      Array.isArray(docs) &&
      typeof iat === 'number';

    if (!isValid) return null;

    return {
      partner,
      tier,
      docs,
      iat,
      exp,
      token,
    };
  } catch (err) {
    console.error('⚠️ Token verification failed in getSessionFromToken:', err);
    return null;
  }
}
