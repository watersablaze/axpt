import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));

  response.cookies.set({
    name: 'council_session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}