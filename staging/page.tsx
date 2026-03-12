import { requireElderServer } from '@/lib/auth/requireElderServer';

type AccessCode = {
  id: string;
  codeHash: string;
  humanCode: string | null;
  partner: string;
  tier: string;
  email: string | null;
  docs: string[];
  displayName: string | null;
  greeting: string | null;
  popupMessage: string | null;
  expiresAt: string | null; // ISO
  maxUses: number;
  usedCount: number;
  enabled: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  lastUsedAt: string | null; // ISO
  lastUsedIp: string | null;
};

function getBaseUrl() {
  // Prefer explicit base in .env for SSR fetches
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return 'http://localhost:3000';
}

async function getCodes(): Promise<AccessCode[]> {
  const base = getBaseUrl();
  const r = await fetch(`${base}/api/admin/access-codes`, { cache: 'no-store' });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detail = body?.error ? ` – ${body.error}` : '';
    throw new Error(`Failed to load access codes (${r.status})${detail}`);
  }
  return body.items || [];
}

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function niceDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default async function AccessCodesAdminPage({
  searchParams,
}: {
  searchParams?: { ok?: string };
}) {
  await requireElderServer();
  const items = await getCodes();
  const ok = searchParams?.ok;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold">Access Codes</h1>
        <p className="text-sm text-zinc-400 mt-1">Issue and manage onboarding access codes.</p>

        {/* Tiny toast via ?ok=created|saved|toggled|expired|deleted */}
        {ok && (
          <div
            role="status"
            className="mt-3 rounded border px-3 py-2 text-sm border-green-700/60 bg-green-900/20 text-green-300"
          >
            {ok === 'created' && 'Access code created.'}
            {ok === 'saved' && 'Changes saved.'}
            {ok === 'toggled' && 'Status updated.'}
            {ok === 'expired' && 'Code expired.'}
            {ok === 'deleted' && 'Access code deleted.'}
            {!['created', 'saved', 'toggled', 'expired', 'deleted'].includes(ok) && 'Done.'}
          </div>
        )}

        {/* Create */}
        <form
          className="mt-6 grid grid-cols-1 sm:grid-cols-6 gap-2"
          action="/api/admin/access-codes"
          method="post"
        >
          <input
            name="partner"
            placeholder="partner (e.g. medicine-warrior)"
            className="bg-black/40 border border-zinc-800 px-2 py-1 rounded"
          />
          <input
            name="tier"
            placeholder="tier (Investor)"
            className="bg-black/40 border border-zinc-800 px-2 py-1 rounded"
          />
          <input
            name="email"
            placeholder="email (optional)"
            className="bg-black/40 border border-zinc-800 px-2 py-1 rounded"
          />
          <input
            name="displayName"
            placeholder="display name"
            className="bg-black/40 border border-zinc-800 px-2 py-1 rounded"
          />
          <input
            name="docs"
            placeholder="docs (csv: whitepaper,hemp,chinje)"
            className="bg-black/40 border border-zinc-800 px-2 py-1 rounded"
          />
          <input
            name="humanCode"
            placeholder="HUMAN-CODE (optional)"
            className="bg-black/40 border border-zinc-800 px-2 py-1 rounded col-span-1 sm:col-span-3"
          />
          <input
            name="expiresAt"
            type="datetime-local"
            className="bg-black/40 border border-zinc-800 px-2 py-1 rounded"
          />
          <input
            name="maxUses"
            type="number"
            min={1}
            defaultValue={1}
            className="bg-black/40 border border-zinc-800 px-2 py-1 rounded"
          />
          <input
            name="popupMessage"
            placeholder="popup message (optional)"
            className="bg-black/40 border border-zinc-800 px-2 py-1 rounded col-span-1 sm:col-span-3"
          />
          <button className="border border-zinc-700 rounded px-3 py-1">Create</button>
        </form>

        {/* List */}
        <div className="mt-6 grid gap-3">
          {items.length === 0 && <div className="text-sm text-zinc-500">No codes yet.</div>}

          {items.map((it) => (
            <div key={it.id} className="border border-zinc-800 rounded p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-mono">{it.humanCode || '—'}</div>
                  <div className="text-xs text-zinc-500">
                    {(it.displayName || '—')} • {it.tier} • uses {it.usedCount}/{it.maxUses}{' '}
                    {it.enabled ? '' : '• (disabled)'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={`/api/admin/access-codes/${it.id}`} method="post">
                    <input type="hidden" name="_action" value="toggle-enabled" />
                    <input type="hidden" name="enabled" value={String(!it.enabled)} />
                    <button
                      className={`px-2 py-1 text-xs rounded border ${
                        it.enabled
                          ? 'border-yellow-600 hover:bg-yellow-900'
                          : 'border-green-600 hover:bg-green-900'
                      }`}
                    >
                      {it.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </form>
                  <form action={`/api/admin/access-codes/${it.id}`} method="post">
                    <input type="hidden" name="_action" value="expire-now" />
                    <button className="px-2 py-1 text-xs rounded border border-orange-600 hover:bg-orange-900">
                      Expire
                    </button>
                  </form>
                  <form action={`/api/admin/access-codes/${it.id}`} method="post">
                    <input type="hidden" name="_action" value="delete" />
                    <button className="px-2 py-1 text-xs rounded border border-red-600 hover:bg-red-900">
                      Delete
                    </button>
                  </form>
                </div>
              </div>

              <div className="text-xs text-zinc-400">
                Docs: {it.docs.length ? it.docs.join(', ') : '—'}
              </div>
              {it.popupMessage && (
                <div className="text-xs text-purple-400 italic">Popup: “{it.popupMessage}”</div>
              )}

              <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500">
                <span>Email: {it.email || '—'}</span>
                <span>Expires: {niceDate(it.expiresAt)}</span>
                <span>Created: {niceDate(it.createdAt)}</span>
                <span>Last used: {niceDate(it.lastUsedAt)}</span>
              </div>

              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-200">
                  Edit details
                </summary>
                <form
                  action={`/api/admin/access-codes/${it.id}`}
                  method="post"
                  className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2"
                >
                  <input type="hidden" name="_action" value="update" />
                  <label className="text-xs text-zinc-400">
                    Human Code
                    <input
                      name="humanCode"
                      defaultValue={it.humanCode || ''}
                      className="w-full mt-1 bg-black/40 border border-zinc-800 px-2 py-1 rounded"
                      placeholder="AXPT-XXXX-XXXX"
                    />
                  </label>
                  <label className="text-xs text-zinc-400">
                    Partner
                    <input
                      name="partner"
                      defaultValue={it.partner}
                      className="w-full mt-1 bg-black/40 border border-zinc-800 px-2 py-1 rounded"
                      placeholder="partner-slug"
                    />
                  </label>
                  <label className="text-xs text-zinc-400">
                    Tier
                    <input
                      name="tier"
                      defaultValue={it.tier}
                      className="w-full mt-1 bg-black/40 border border-zinc-800 px-2 py-1 rounded"
                      placeholder="Investor"
                    />
                  </label>
                  <label className="text-xs text-zinc-400">
                    Display Name
                    <input
                      name="displayName"
                      defaultValue={it.displayName || ''}
                      className="w-full mt-1 bg-black/40 border border-zinc-800 px-2 py-1 rounded"
                      placeholder="Medicine Warrior"
                    />
                  </label>
                  <label className="text-xs text-zinc-400 md:col-span-2">
                    Email
                    <input
                      name="email"
                      defaultValue={it.email || ''}
                      className="w-full mt-1 bg-black/40 border border-zinc-800 px-2 py-1 rounded"
                      placeholder="user@example.com"
                    />
                  </label>
                  <label className="text-xs text-zinc-400 md:col-span-2">
                    Docs (comma separated)
                    <input
                      name="docs"
                      defaultValue={it.docs.join(',')}
                      className="w-full mt-1 bg-black/40 border border-zinc-800 px-2 py-1 rounded"
                      placeholder="whitepaper,hemp,chinje"
                    />
                  </label>
                  <label className="text-xs text-zinc-400 md:col-span-2">
                    Popup Message
                    <input
                      name="popupMessage"
                      defaultValue={it.popupMessage || ''}
                      className="w-full mt-1 bg-black/40 border border-zinc-800 px-2 py-1 rounded"
                      placeholder="Optional popup"
                    />
                  </label>
                  <label className="text-xs text-zinc-400">
                    Expires At
                    <input
                      type="datetime-local"
                      name="expiresAt"
                      defaultValue={toLocalInput(it.expiresAt)}
                      className="w-full mt-1 bg-black/40 border border-zinc-800 px-2 py-1 rounded"
                    />
                  </label>
                  <label className="text-xs text-zinc-400">
                    Max Uses
                    <input
                      type="number"
                      name="maxUses"
                      min={1}
                      defaultValue={it.maxUses}
                      className="w-full mt-1 bg-black/40 border border-zinc-800 px-2 py-1 rounded"
                    />
                  </label>

                  <div className="md:col-span-2 flex items-center justify-between mt-2">
                    <label className="text-xs text-zinc-400 inline-flex items-center gap-2">
                      <input type="checkbox" name="enabled" defaultChecked={it.enabled} />
                      Enabled
                    </label>
                    <button className="px-3 py-1 text-sm border border-zinc-700 rounded hover:border-purple-500/60">
                      Save
                    </button>
                  </div>
                </form>
              </details>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}