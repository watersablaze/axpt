// app/src/lib/auth/getSessionFromToken.ts

import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || 'changeme');

export async function getSessionFromToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  if (!payload || typeof payload !== 'object') throw new Error('Invalid token payload');
  return payload;
}