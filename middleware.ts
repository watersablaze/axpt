import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/council')) {
    return NextResponse.next();
  }

  if (pathname === '/council/login') {
    return NextResponse.next();
  }

  const session = req.cookies.get('council_session')?.value;

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/council/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/council/:path*'],
};