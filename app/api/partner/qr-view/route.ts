import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/token';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect('/partner/qr-confirm?error=missing_token');
  }

  const verified = verifyToken(token);

  if (!verified) {
    return NextResponse.redirect('/partner/qr-confirm?error=invalid_token');
  }

  return NextResponse.redirect(`/partner/qr-confirm?token=${encodeURIComponent(token)}`);
}