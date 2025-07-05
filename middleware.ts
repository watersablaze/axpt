// middleware.ts

import { NextRequest, NextResponse } from 'next/server';

// Add protected routes if needed
const protectedRoutes: string[] = [];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Optionally protect routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // Add basic redirect or logic here later if needed
    return NextResponse.redirect(new URL('/onboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|docs|api|static).*)'], // Run on everything but assets/docs/api
};