// app/admin/settings/settings-form.tsx
'use client';

import { useState } from 'react';

type Settings = {
  provider: 'resend' | 'postmark' | null;
  fromEmail: string | null;
  councilEmails: string[] | null;
  slackWebhookUrl: string | null;
};

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [provider, setProvider] = useState<'' | 'resend' | 'postmark'>(
    (initial.provider as any) || ''
  );
  const [fromEmail, setFromEmail] = useState(initial.fromEmail || '');
  const [councilEmails, setCouncilEmails] = useState((initial.councilEmails || []).join(', '));
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(initial.slackWebhookUrl || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: provider || null,
          fromEmail,
          councilEmails,
          slackWebhookUrl,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Save failed');
      setMsg('Saved.');
    } catch (e: any) {
      setMsg(e.message || 'Error saving settings');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6 space-y-5">
      <div>
        <label className="block text-sm mb-1">Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as any)}
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"
        >
          <option value="">(auto: Resend if configured)</option>
          <option value="resend">Resend</option>
          <option value="postmark">Postmark</option>
        </select>
        <p className="text-xs text-zinc-500 mt-1">
          Set API keys in environment. You can override the “From” below.
        </p>
      </div>

      <div>
        <label className="block text-sm mb-1">From Email (override)</label>
        <input
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder="e.g. council@axpt.io"
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"
        />
        <p className="text-xs text-zinc-500 mt-1">
          If blank, will default to NOTIFY_FROM_EMAIL / provider default.
        </p>
      </div>

      <div>
        <label className="block text-sm mb-1">Council Emails</label>
        <textarea
          value={councilEmails}
          onChange={(e) => setCouncilEmails(e.target.value)}
          placeholder="comma separated emails"
          rows={3}
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Slack Webhook URL</label>
        <input
          value={slackWebhookUrl}
          onChange={(e) => setSlackWebhookUrl(e.target.value)}
          placeholder="https://hooks.slack.com/services/..."
          className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2"
        />
      </div>

      <div className="pt-1">
        <button
          onClick={save}
          disabled={busy}
          className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-purple-500/60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        {msg && <span className="ml-3 text-sm text-zinc-400">{msg}</span>}
      </div>
    </div>
  );
}