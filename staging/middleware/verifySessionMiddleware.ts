// lib/middleware/verifySessionMiddleware.ts
import { getTokenFromCookie, decodeSessionToken } from '@/lib/auth/session';
import { TokenPayloadSafeSchema } from '@/lib/token/tokenSchema';

export async function verifySessionMiddleware() {
  const token = await getTokenFromCookie();
  if (!token) return null;

  const decoded = await decodeSessionToken(token);
  if (!decoded) return null;

  const parsed = TokenPayloadSafeSchema.safeParse(decoded);
  if (!parsed.success) return null;

  const now = Math.floor(Date.now() / 1000);
  if (parsed.data.exp && parsed.data.exp < now) return null;

  return parsed.data;
}