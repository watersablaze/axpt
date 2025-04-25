// app/api/partner/validateToken/route.ts
import { NextResponse } from 'next/server';
import { verifyTokenSignature } from '@/lib/tokenUtils';

export async function POST(req: Request) {
  const body = await req.json();
  const { token, signature } = body;

  if (!token || !signature) {
    return NextResponse.json({ error: 'Missing token or signature.' }, { status: 400 });
  }

  const isValid = verifyTokenSignature(token, signature);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid token or signature.' }, { status: 403 });
  }

  return NextResponse.json({ success: true, message: 'Token validated successfully.' });
}