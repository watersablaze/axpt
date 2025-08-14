// app/api/admin/settings/route.ts
import { NextResponse } from 'next/server';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { getSettings, updateSetting } from '@/lib/settings';

function splitEmails(input: unknown): string[] {
  const raw = typeof input === 'string' ? input : Array.isArray(input) ? input.join(',') : '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET() {
  try {
    await requireElderServer();
    const settings = await getSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Forbidden' }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireElderServer();
    const body = await req.json().catch(() => ({} as any));

    const provider =
      body?.provider === 'resend' || body?.provider === 'postmark' ? body.provider : null;

    const fromEmail =
      typeof body?.fromEmail === 'string' && body.fromEmail.trim().length
        ? body.fromEmail.trim()
        : '';

    const councilEmails = splitEmails(body?.councilEmails);

    const slackWebhookUrl =
      typeof body?.slackWebhookUrl === 'string' && body.slackWebhookUrl.trim().length
        ? body.slackWebhookUrl.trim()
        : '';

    // persist fields individually
    if (provider) await updateSetting('emailProvider', provider);
    await updateSetting('emailFrom', fromEmail);
    await updateSetting('councilEmails', councilEmails.join(','));
    await updateSetting('slackWebhookUrl', slackWebhookUrl);

    const settings = await getSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Forbidden' }, { status: 403 });
  }
}