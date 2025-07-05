import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'defaultsecret');

export type SessionPayload = {
  userId: string;
  tier: string;
  displayName?: string;
  docs?: string[];
};

type CreateSessionInput = SessionPayload;

export async function createSessionCookie({
  userId,
  tier,
  displayName,
  docs = [],
}: CreateSessionInput): Promise<{
  jwt: string;
  cookie: string;
}> {
  const payload: SessionPayload = { userId, tier, displayName, docs };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const cookie = [
    `axpt_session=${jwt}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    `Max-Age=${7 * 24 * 60 * 60}`,
  ]
    .filter(Boolean)
    .join('; ');

  return { jwt, cookie };
}