// app/api/admin/notify-test/route.ts
import { NextResponse } from 'next/server';
import {
  sendCouncilNotification,
  sendSlackNotification,
} from '@/lib/notify';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export async function POST() {
  try {
    await requireElderServer();

    const subject = 'AXPT: Notification test';
    const html = `<div style="font-family:Inter,system-ui,sans-serif">
      <h2>AXPT Admin Test</h2>
      <p>This is a <b>test</b> notification from the Council settings.</p>
    </div>`;
    const text = 'AXPT Admin Test — This is a test notification from the Council settings.';

    const emailRes = await sendCouncilNotification(subject, html, text);
    const slackRes = await sendSlackNotification(':white_check_mark: Test notification from AXPT admin.');

    return NextResponse.json({ ok: true, emailRes, slackRes });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Forbidden' }, { status: 403 });
  }
}