import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'changeme');

type EdgeUserSession = {
  userId: string;
  tier?: string;
  displayName?: string;
};

export async function getCurrentUserFromEdge(req: NextRequest): Promise<EdgeUserSession | null> {
  const token = req.cookies.get('axpt_session')?.value;
  if (!token) {
    console.warn('⚠️ No session cookie found in request.');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    if (typeof payload !== 'object' || typeof payload.userId !== 'string') {
      console.warn('⚠️ Invalid session payload structure.');
      return null;
    }

    return {
      userId: payload.userId,
      tier: typeof payload.tier === 'string' ? payload.tier : undefined,
      displayName: typeof payload.displayName === 'string' ? payload.displayName : undefined,
    };
  } catch (err) {
    console.error('❌ Session token verification failed:', err);
    return null;
  }
}
