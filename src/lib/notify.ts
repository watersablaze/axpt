// src/lib/notify.ts
import { getSettings, type SettingsSnapshot } from '@/lib/settings';

type EmailProvider = 'resend' | 'postmark' | null;

type EmailResult =
  | { ok: true; provider: EmailProvider; result?: unknown }
  | { ok: false; provider: EmailProvider; reason: string };

type SlackResult =
  | { ok: true }
  | { ok: false; status?: number; body?: string; reason?: string };

/**
 * Send council email. Uses Settings + env:
 * - provider: 'resend' | 'postmark' (auto 'resend' if RESEND_API_KEY exists)
 * - from: settings.fromEmail || NOTIFY_FROM_EMAIL (or provider-specific override)
 * - recipients: settings.councilEmails
 */
export async function sendCouncilNotification(
  subject: string,
  html: string,
  text?: string
): Promise<EmailResult> {
  const settings: SettingsSnapshot = await getSettings();

  const provider: EmailProvider =
    settings.provider || (process.env.RESEND_API_KEY ? 'resend' : null);

  const from =
    settings.fromEmail ||
    process.env.NOTIFY_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.POSTMARK_FROM_EMAIL ||
    'no-reply@axpt.io';

  const emails = (settings.councilEmails as string[] | undefined)?.map((s) => s.trim()).filter(Boolean) ?? [];

  if (!emails.length) {
    return { ok: false, provider, reason: 'No council emails configured' };
  }

  if (provider === 'resend') {
    const { Resend } = await import('resend');
    const apiKey = process.env.RESEND_API_KEY || '';
    if (!apiKey) return { ok: false, provider, reason: 'Missing RESEND_API_KEY' };

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from,
      to: emails,
      subject,
      html,
      ...(text ? { text } : {}),
    });

    return { ok: true, provider, result };
  }

  if (provider === 'postmark') {
    const { ServerClient } = await import('postmark');
    const apiKey = process.env.POSTMARK_API_KEY || '';
    if (!apiKey) return { ok: false, provider, reason: 'Missing POSTMARK_API_KEY' };

    const client = new ServerClient(apiKey);

    const result = await client.sendEmail({
      From: from,
      To: emails.join(','),
      Subject: subject,
      HtmlBody: html,
      ...(text ? { TextBody: text } : {}),
    });

    return { ok: true, provider, result };
  }

  return { ok: false, provider, reason: 'No email provider configured' };
}

/**
 * Send a Slack webhook notification.
 * Accepts either:
 *   - string  → treated as { text: string }
 *   - object  → sent as-is (e.g., with blocks/attachments)
 * Uses settings.slackWebhookUrl or env fallback.
 */
export async function sendSlackNotification(
  payload: string | Record<string, any>
): Promise<SlackResult> {
  const settings = await getSettings();
  const webhook =
    settings.slackWebhookUrl ||
    process.env.SLACK_WEBHOOK_URL ||
    process.env.COUNCIL_SLACK_WEBHOOK_URL ||
    '';

  if (!webhook) {
    return { ok: false, reason: 'No slack webhook configured' };
  }

  const body =
    typeof payload === 'string' ? { text: payload } : payload || { text: '' };

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, status: res.status, body: text || 'Slack error' };
  }

  return { ok: true };
}

/**
 * Convenience alias to send a simple text message to Slack.
 */
export async function sendSlack(
  text: string
): Promise<{ ok: boolean; provider: 'slack'; reason?: string }> {
  const res = await sendSlackNotification({ text });
  return res.ok
    ? { ok: true, provider: 'slack' }
    : { ok: false, provider: 'slack', reason: res.reason ?? `HTTP ${res.status ?? ''}`.trim() };
}