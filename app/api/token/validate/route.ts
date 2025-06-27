// app/api/token/validate/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { token } = await req.json();

  // TODO: Replace with actual HMAC or signature check logic
  const isValid = token === 'your-generated-token';

  if (!isValid) {
    return NextResponse.json({ valid: false, reason: 'Invalid token' }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}