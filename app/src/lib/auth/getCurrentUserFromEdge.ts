import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'changeme');

export async function getCurrentUserFromEdge(req: NextRequest) {
  const token = req.cookies.get('axpt_session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.userId || !payload.tier) return null;

    return {
      userId: payload.userId as string,
      tier: payload.tier as string,
    };
  } catch (err) {
    console.error('❌ Session verification failed:', err);
    return null;
  }
}