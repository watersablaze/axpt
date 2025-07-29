import { decodeToken } from './decodeToken';
import { signToken } from './signToken';
import type { TokenPayload } from '@/types/token';

const DEFAULT_EXP_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function renewToken(oldToken: string): Promise<string> {
  const decoded = await decodeToken(oldToken);

  // Check required fields
  if (
    !decoded ||
    typeof decoded !== 'object' ||
    !decoded.userId ||
    !decoded.partner ||
    !decoded.tier ||
    !decoded.docs
  ) {
    throw new Error('Invalid or incomplete token payload for renewal');
  }

  const now = Math.floor(Date.now() / 1000);

  const newPayload: TokenPayload = {
    ...decoded,
    iat: now,
    exp: now + DEFAULT_EXP_SECONDS,
  };

  return await signToken(newPayload);
}