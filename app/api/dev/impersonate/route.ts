import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { createSessionToken } from '@/lib/auth/session';
import { COOKIE_NAME } from '@/shared/constants/cookies';
import type { SessionPayload } from '@/shared/types/auth';

function notAllowed() {
  return new NextResponse('Not allowed in production', { status: 403 });
}

function normalizeResidentTier(
  tier: string | null | undefined
): SessionPayload['tier'] | null {
  const normalized = tier?.trim().toLowerCase();

  switch (normalized) {
    case 'investor':
      return 'Investor';
    case 'partner':
      return 'Partner';
    case 'farmer':
      return 'Farmer';
    case 'merchant':
      return 'Merchant';
    case 'nomad':
      return 'Nomad';
    case 'board':
      return 'Board';
    case 'resident':
      // Legacy resident tier collapses to the default resident portal tier.
      return 'Nomad';
    default:
      return null;
  }
}

function clearCookiesAndRedirect(req: Request) {
  const res = NextResponse.redirect(new URL('/dev/portal', req.url));
  res.cookies.set('dev_impersonate_email', '', { expires: new Date(0), path: '/' });
  res.cookies.set(COOKIE_NAME, '', { expires: new Date(0), path: '/' });
  return res;
}

async function handle(email: string, req: Request) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, tier: true, name: true, displayName: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  const canonicalTier = normalizeResidentTier(user.tier);
  if (!canonicalTier) {
    return NextResponse.json(
      { ok: false, error: 'User does not have a resident-eligible tier' },
      { status: 400 }
    );
  }

  const token = await createSessionToken({
    userId: user.id,
    tier: canonicalTier,
    roles: [],
    displayName: user.displayName ?? user.name ?? 'Resident',
    popupMessage: 'Development Resident Session',
    greeting: 'Welcome back',
    email: user.email,
    partner: 'AXPT',
    docs: ['whitepaper'],
  });

  // Always set the dev cookie and redirect RELATIVE to req.url (so CF domain is preserved)
  const res = NextResponse.redirect(new URL('/dev/portal', req.url));
  const isProd = process.env.NODE_ENV === 'production';

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  res.cookies.set('dev_impersonate_email', user.email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  });
  return res;
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') return notAllowed();

  const url = new URL(req.url);
  if (url.searchParams.get('clear')) return clearCookiesAndRedirect(req);

  const email = url.searchParams.get('email') || '';
  if (!email) return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 });
  return handle(email, req);
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') return notAllowed();

  const url = new URL(req.url);
  if (url.searchParams.get('clear')) return clearCookiesAndRedirect(req);

  const ctype = req.headers.get('content-type') || '';
  let email = '';
  if (ctype.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    email = body?.email || '';
  } else {
    const form = await req.formData().catch(() => null);
    email = form ? String(form.get('email') || '') : '';
  }
  if (!email) return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 });
  return handle(email, req);
}
