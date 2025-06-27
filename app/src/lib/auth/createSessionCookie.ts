import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'changeme');

export async function createSessionCookie({
  userId,
  tier,
}: {
  userId: string;
  tier: string | null;
}) {
  const jwt = await new SignJWT({ userId, tier })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const cookieStore = cookies(); // ✅ sync
  cookieStore.set('axpt_session', jwt, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return jwt;
}