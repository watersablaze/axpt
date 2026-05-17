import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DEV_ONLY_PREFIXES = [
  '/debug',
  '/dev',
  '/dev-tools',
  '/api/debug',
  '/api/dev',
  '/api/dev-login',
]

const AUTHENTICATED_PREFIXES = [
  '/admin',
  '/api/admin',
  '/api/treasury',
  '/api/governance',
  '/portal',
  '/account',
]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProd = process.env.NODE_ENV === 'production'

  if (
    isProd &&
    DEV_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  if (pathname.startsWith('/council')) {
    if (pathname === '/council/login') {
      return NextResponse.next()
    }

    const councilSession =
      req.cookies.get('council_session')?.value

    if (!councilSession) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/council/login'
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  if (
    AUTHENTICATED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    )
  ) {
    const axptSession =
      req.cookies.get('axpt_session')?.value

    if (!axptSession) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/treasury/:path*',
    '/api/governance/:path*',
    '/portal/:path*',
    '/account/:path*',
    '/council/:path*',
    '/debug/:path*',
    '/dev/:path*',
    '/dev-tools/:path*',
    '/api/debug/:path*',
    '/api/dev/:path*',
    '/api/dev-login',
  ],
}