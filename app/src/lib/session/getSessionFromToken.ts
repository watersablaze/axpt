import { verifyToken } from '@/utils/token';

export interface SessionPayload {
  partner: string;
  tier: string;
  docs: string[];
  iat: number;
  token: string;
}

export function getSessionFromToken(token: string): SessionPayload | null {
  try {
    const payload = verifyToken(token);
    if (!payload) return null;

    const { partner, tier, docs, iat } = payload;

    if (
      typeof partner === 'string' &&
      typeof tier === 'string' &&
      Array.isArray(docs)
    ) {
      return {
        partner,
        tier,
        docs,
        iat,
        token,
      };
    }

    return null;
  } catch (err) {
    console.error('⚠️ Token verification failed:', err);
    return null;
  }
}