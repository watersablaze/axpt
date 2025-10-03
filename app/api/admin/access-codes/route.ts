import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export const runtime = 'nodejs';

function parseDocs(input: unknown): string[] | undefined {
  if (Array.isArray(input)) return input.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

// Accepts <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
function parseDateTimeLocal(v: unknown): Date | null | undefined {
  if (v == null || v === '') return undefined; // ignore (no change)
  if (typeof v !== 'string') return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null; // explicit clear
  return d;
}

function hashCode(code: string, salt: string) {
  return crypto.createHash('sha256').update(`${code}${salt}`).digest('hex');
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function generateHumanCode(partner?: string) {
  const stem = partner ? slugify(partner) : 'guest';
  // simple readable code: AXPT-<STEMNOHYPHENSUPPER>-XXXX-YY
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const rnd = (n: number) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const block1 = slugify(stem).replace(/-/g, '').toUpperCase().slice(0, 14) || 'AXPT';
  return `AXPT-${block1}-${rnd(4)}-${rnd(2)}`;
}

// ✅ absolute redirect using current request as base
function redirectBack(req: NextRequest, ok?: string) {
  const url = new URL('/admin/access-codes', req.url);
  if (ok) url.searchParams.set('ok', ok);
  return NextResponse.redirect(url, { status: 303 });
}

/**
 * GET /api/admin/access-codes
 * List codes (admin)
 */
export async function GET(req: NextRequest) {
  await requireElderServer();

  try {
    const items = await prisma.accessCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error('[access-codes] GET error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/access-codes
 * Create a new access code (admin)
 */
export async function POST(req: NextRequest) {
  await requireElderServer();

  // 🔐 hard-require ACCESS_CODE_SALT
  const salt = process.env.ACCESS_CODE_SALT;
  if (!salt) {
    return NextResponse.json(
      { ok: false, error: 'ACCESS_CODE_SALT is missing. Set it in your environment.' },
      { status: 500 },
    );
  }

  const ct = (req.headers.get('content-type') || '').toLowerCase();
  let body: Record<string, any> = {};
  let fromForm = false;

  // ✅ Read ONCE based on content-type
  if (ct.includes('application/json')) {
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }
  } else {
    const form = await req.formData();
    fromForm = true;
    body = Object.fromEntries(form.entries());
  }

  try {
    // Inputs
    const partner = (body.partner ?? '').toString().trim();
    const tier = (body.tier ?? '').toString().trim();
    const email = body.email ? body.email.toString().trim() : null;
    const displayName = body.displayName ? body.displayName.toString().trim() : null;
    const popupMessage = body.popupMessage ? body.popupMessage.toString().trim() : null;

    const docs = parseDocs(body.docs) ?? [];

    // Allow either `humanCode` or `code`
    let humanCode = (body.humanCode ?? body.code ?? '').toString().trim();
    if (!humanCode) {
      humanCode = generateHumanCode(partner);
    }

    const expiresAtParsed = parseDateTimeLocal(body.expiresAt);
    const expiresAt =
      expiresAtParsed === undefined
        ? undefined
        : expiresAtParsed === null
        ? null
        : expiresAtParsed;

    let maxUses = 1;
    if (body.maxUses != null) {
      const n = Number(body.maxUses);
      if (!Number.isNaN(n) && n > 0) maxUses = n;
    }

    const codeHash = hashCode(humanCode, salt);

    const created = await prisma.accessCode.create({
      data: {
        codeHash,
        humanCode, // optional display
        partner,
        tier,
        email,
        docs,
        displayName,
        greeting: null,
        popupMessage,
        expiresAt: expiresAt as any, // prisma accepts Date | null | undefined
        maxUses,
        usedCount: 0,
        enabled: true,
      },
    });

    if (fromForm) {
      return redirectBack(req, 'created');
    }
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    // Handle unique constraint errors clearly
    const msg = e?.message || 'Server error';
    const isUnique = /Unique constraint/i.test(msg) || /unique constraint/i.test(msg);
    const pretty = isUnique
      ? 'A code with this value already exists (codeHash unique constraint). Use a different human code.'
      : msg;

    console.error('[access-codes] POST error:', e);
    return NextResponse.json({ ok: false, error: pretty }, { status: 500 });
  }
}