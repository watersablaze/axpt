// src/lib/settings.ts
// Centralized Council/Admin settings with in-memory overrides and a small cache.
// If you later add a DB table, you can hydrate/set overrides from there.

export type EmailProvider = 'resend' | 'postmark' | null;

export type SettingsSnapshot = {
  provider: EmailProvider;
  fromEmail: string | null;
  councilEmails: string[];        // list of emails
  slackWebhookUrl: string | null; // Slack incoming webhook
};

// In-memory overrides + 10s cache for computed snapshot
type Overrides = Partial<SettingsSnapshot>;
let _overrides: Overrides = {};

let _cache:
  | { value: SettingsSnapshot; at: number }
  | null = null;

const CACHE_MS = 10_000;

// Merge ENV defaults with overrides to produce a SettingsSnapshot
function computeSnapshot(): SettingsSnapshot {
  const envProvider: EmailProvider =
    (process.env.NOTIFY_EMAIL_PROVIDER as EmailProvider) ||
    (process.env.RESEND_API_KEY ? 'resend' : null);

  const envFrom =
    process.env.NOTIFY_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.POSTMARK_FROM_EMAIL ||
    null;

  const envEmails = (process.env.COUNCIL_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const envSlack =
    process.env.SLACK_WEBHOOK_URL ||
    process.env.COUNCIL_SLACK_WEBHOOK_URL ||
    null;

  const provider = _overrides.provider ?? envProvider ?? null;
  const fromEmail = _overrides.fromEmail ?? envFrom ?? null;
  const councilEmails =
    _overrides.councilEmails ?? envEmails;
  const slackWebhookUrl =
    _overrides.slackWebhookUrl ?? envSlack;

  return { provider, fromEmail, councilEmails, slackWebhookUrl };
}

export async function getSettings(): Promise<SettingsSnapshot> {
  const now = Date.now();
  if (_cache && now - _cache.at < CACHE_MS) return _cache.value;

  const snap = computeSnapshot();
  _cache = { value: snap, at: now };
  return snap;
}

// Update a single setting (kept for compatibility)
export async function updateSetting(
  key: 'emailProvider' | 'emailFrom' | 'councilEmails' | 'slackWebhookUrl',
  value: string
): Promise<void> {
  switch (key) {
    case 'emailProvider':
      _overrides.provider = (value as EmailProvider) || null;
      break;
    case 'emailFrom':
      _overrides.fromEmail = value || null;
      break;
    case 'councilEmails':
      _overrides.councilEmails = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      break;
    case 'slackWebhookUrl':
      _overrides.slackWebhookUrl = value || null;
      break;
  }
  _cache = null;
}

// Batch update (used by /api/admin/settings)
export async function updateSettings(input: {
  provider?: EmailProvider | '' | null;
  fromEmail?: string | null;
  councilEmails?: string | string[] | null; // comma string or array
  slackWebhookUrl?: string | null;
}): Promise<void> {
  if (typeof input.provider !== 'undefined') {
    _overrides.provider = (input.provider || null) as EmailProvider;
  }
  if (typeof input.fromEmail !== 'undefined') {
    _overrides.fromEmail = input.fromEmail || null;
  }
  if (typeof input.councilEmails !== 'undefined') {
    if (Array.isArray(input.councilEmails)) {
      _overrides.councilEmails = input.councilEmails
        .map((s) => String(s).trim())
        .filter(Boolean);
    } else {
      _overrides.councilEmails = (input.councilEmails || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  if (typeof input.slackWebhookUrl !== 'undefined') {
    _overrides.slackWebhookUrl = input.slackWebhookUrl || null;
  }
  _cache = null;
}