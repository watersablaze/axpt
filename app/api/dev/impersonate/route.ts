import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { switchToResidentSession } from '@/lib/auth/switchToResidentSession';

function notAllowed() {
  return new NextResponse('Not allowed in production', { status: 403 });
}

function clearCookiesAndRedirect(req: Request) {
  const res = NextResponse.redirect(new URL('/dev/portal', req.url));
  // clear both dev + app session markers
  res.cookies.set('dev_impersonate_email', '', { expires: new Date(0), path: '/' });
  res.cookies.set('axpt_session_email', '', { expires: new Date(0), path: '/' });
  return res;
}

async function handle(email: string, req: Request) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, tier: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  // Optional: write your real session too if available
  try {
    await switchToResidentSession({
      userId: user.id,
      email: user.email,
      tier: user.tier ?? undefined,
    });
  } catch {
    // dev path should work even if this is a no-op locally
  }

  // Always set the dev cookie and redirect RELATIVE to req.url (so CF domain is preserved)
  const res = NextResponse.redirect(new URL('/dev/portal', req.url));
  res.cookies.set('dev_impersonate_email', user.email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
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