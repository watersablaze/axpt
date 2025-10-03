import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

function parseBoolean(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (s === 'true') return true;
    if (s === 'false') return false;
  }
  return undefined;
}

function parseDocs(input: unknown): string[] | undefined {
  if (Array.isArray(input)) return input.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof input === 'string') {
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}

// Accepts <input type="datetime-local"> value (YYYY-MM-DDTHH:mm)
function parseDateTimeLocal(v: unknown): Date | null | undefined {
  if (v == null || v === '') return undefined; // ignore (no change)
  if (typeof v !== 'string') return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null; // explicit clear
  return d;
}

// ✅ absolute redirect using current request as base (required by Next 15 route handlers)
function redirectBack(req: NextRequest, ok?: string) {
  const url = new URL('/admin/access-codes', req.url);
  if (ok) url.searchParams.set('ok', ok);
  return NextResponse.redirect(url, { status: 303 });
}

// NOTE: params is a Promise in newer Next.js. Await it.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireElderServer();

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });

  // ✅ Read the body exactly once based on Content-Type
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  let body: Record<string, any> = {};
  let fromForm = false;

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

  const action = String(body._action || '').trim();

  try {
    switch (action) {
      case 'update': {
        const data: any = {};

        if ('humanCode' in body) data.humanCode = body.humanCode ? String(body.humanCode).trim() : null;
        if ('partner' in body) data.partner = String(body.partner || '').trim();
        if ('tier' in body) data.tier = String(body.tier || '').trim();
        if ('displayName' in body) data.displayName = body.displayName ? String(body.displayName).trim() : null;
        if ('email' in body) data.email = body.email ? String(body.email).trim() : null;

        const docs = parseDocs(body.docs);
        if (docs) data.docs = docs;

        if ('popupMessage' in body) data.popupMessage = body.popupMessage ? String(body.popupMessage).trim() : null;

        const expiresAt = parseDateTimeLocal(body.expiresAt);
        if (expiresAt !== undefined) data.expiresAt = expiresAt; // undefined=ignore, null=clear, Date=set

        if ('maxUses' in body) {
          const n = Number(body.maxUses);
          if (!Number.isNaN(n) && n > 0) data.maxUses = n;
        }

        const enabled = parseBoolean(body.enabled);
        if (enabled !== undefined) data.enabled = enabled;

        const saved = await prisma.accessCode.update({ where: { id }, data });
        return fromForm ? redirectBack(req, 'saved') : NextResponse.json({ ok: true, item: saved });
      }

      case 'toggle-enabled': {
        const enabled = parseBoolean(body.enabled);
        if (enabled === undefined) {
          return NextResponse.json({ ok: false, error: 'enabled must be true|false' }, { status: 400 });
        }
        const saved = await prisma.accessCode.update({ where: { id }, data: { enabled } });
        return fromForm ? redirectBack(req, 'toggled') : NextResponse.json({ ok: true, item: saved });
      }

      case 'expire-now': {
        const saved = await prisma.accessCode.update({ where: { id }, data: { expiresAt: new Date() } });
        return fromForm ? redirectBack(req, 'expired') : NextResponse.json({ ok: true, item: saved });
      }

      case 'delete': {
        await prisma.accessCode.delete({ where: { id } });
        return fromForm ? redirectBack(req, 'deleted') : NextResponse.json({ ok: true, deleted: id });
      }

      default:
        return NextResponse.json(
          { ok: false, error: 'Unknown action. Use: update | toggle-enabled | expire-now | delete' },
          { status: 400 },
        );
    }
  } catch (e: any) {
    console.error('[access-codes:id] error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}

// Optional GET to fetch a single item
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireElderServer();
  try {
    const { id } = await ctx.params;
    const item = await prisma.accessCode.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}