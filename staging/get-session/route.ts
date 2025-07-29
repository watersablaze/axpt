import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookie } from '@/lib/token/getTokenFromCookie';
import { decodeToken } from '@/lib/token/decodeToken';
import { TokenPayloadSafeSchema } from '@/lib/token/tokenSchema';

export async function GET(_req: NextRequest) {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ session: null });
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return NextResponse.json({ session: null });
  }

  const parsed = TokenPayloadSafeSchema.safeParse(decoded);
  if (!parsed.success) {
    return NextResponse.json({ session: null });
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.data.exp && parsed.data.exp < now) {
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({ session: parsed.data });
}