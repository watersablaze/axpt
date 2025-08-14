// app/dev/guard/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import DevBanner from '@/components/dev/DevBanner';

type CheckRow = { table: string; present: boolean };

function maskUrl(url?: string) {
  if (!url) return 'not set';
  // hide credentials + host specifics
  try {
    const u = new URL(url);
    return `${u.protocol}//***:***@${u.hostname}/${u.pathname.replace('/', '')}`;
  } catch {
    return '***';
  }
}

export default async function DevGuard() {
  // Hide in production
  if (process.env.NODE_ENV === 'production') {
    redirect('/portal');
  }

  // 1) Basic DB connectivity
  let dbOk = false;
  let dbErr: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e: any) {
    dbOk = false;
    dbErr = e?.message ?? 'Unknown error';
  }

  // 2) Expected tables (update if you add/remove models)
  const expectedModels = [
    // Core
    'User','Wallet','Balance','BlockchainWallet','Transaction','SmartContract',
    'ContractInteractionLog','Session','SessionActionLog','SessionLog','PinLoginRequest',
    'Stake','InvestmentProposal','NFTBadge','SimProfile','NodeSyncStatus','RevokedToken',
    'Partner','TokenAccessLog','IssuedToken','LogoutLog','GemIntake','DbPulseLog',
    // DAO
    'Token','CouncilElder','GovernanceProposal','GovernanceVote','TokenIssuanceRequest'
  ];

  let tableChecks: CheckRow[] = [];
  if (dbOk) {
    // Use to_regclass on each name like public."User"
    tableChecks = await Promise.all(
      expectedModels.map(async (name) => {
        const sql = `SELECT to_regclass('public."${name}"') as reg`;
        try {
          const rows: Array<{ reg: string | null }> = await prisma.$queryRawUnsafe(sql);
          const present = !!rows?.[0]?.reg;
          return { table: name, present };
        } catch {
          return { table: name, present: false };
        }
      })
    );
  }

  // 3) Session cookie presence
  const hasSessionCookie = !!(await cookies()).get('axpt_session')?.value;

  // 4) Summaries
  const missing = tableChecks.filter(t => !t.present);
  const allGood = dbOk && missing.length === 0;

  return (
    <main className="min-h-screen relative bg-black text-white">
      <DevBanner note="DB & session sanity checks. Hidden in production." />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(136,96,208,0.15),transparent_60%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 space-y-8">
        <header>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dev Guard</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Quick diagnostics for your dev environment.
          </p>
        </header>

        {/* Environment */}
        <section className="rounded-2xl border border-zinc-800 bg-white/5 p-5">
          <h2 className="text-lg font-semibold mb-2">Environment</h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-zinc-400">NODE_ENV</div>
              <div className="text-zinc-200">{process.env.NODE_ENV}</div>
            </div>
            <div>
              <div className="text-zinc-400">Database (masked)</div>
              <div className="text-zinc-200">{maskUrl(process.env.DATABASE_URL)}</div>
            </div>
          </div>
        </section>

        {/* DB connectivity */}
        <section className="rounded-2xl border border-zinc-800 bg-white/5 p-5">
          <h2 className="text-lg font-semibold mb-2">Database Connectivity</h2>
          {dbOk ? (
            <p className="text-sm text-emerald-400">✅ Connected (SELECT 1 succeeded)</p>
          ) : (
            <div className="text-sm text-rose-400">
              ❌ Not connected
              {dbErr && <div className="text-xs text-rose-300 mt-1">{dbErr}</div>}
            </div>
          )}
          <p className="text-xs text-zinc-500 mt-2">
            If failing: verify <code>.env</code> DATABASE_URL, network access, and that the DB is reachable from this environment.
          </p>
        </section>

        {/* Table presence */}
        <section className="rounded-2xl border border-zinc-800 bg-white/5 p-5">
          <h2 className="text-lg font-semibold mb-2">Expected Tables</h2>
          {dbOk ? (
            <>
              <ul className="grid md:grid-cols-2 gap-2 text-sm">
                {tableChecks.map((t) => (
                  <li key={t.table} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
                    <span className="text-zinc-200">{t.table}</span>
                    <span className={t.present ? 'text-emerald-400' : 'text-rose-400'}>
                      {t.present ? 'Present' : 'Missing'}
                    </span>
                  </li>
                ))}
              </ul>
              {missing.length > 0 ? (
                <div className="mt-3 text-sm text-amber-300">
                  ⚠️ {missing.length} table(s) missing. For a quick sync in dev, run:
                  <pre className="mt-2 bg-black/40 border border-zinc-800 rounded p-2 text-xs">
                    pnpm prisma db push
                  </pre>
                  <p className="text-xs text-zinc-500 mt-2">
                    For long‑term tracking, create proper migrations locally with
                    <code className="mx-1">pnpm prisma migrate dev</code>, commit them, then
                    <code className="mx-1">pnpm prisma migrate deploy</code> on the server.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-emerald-400">✅ All expected tables are present.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-400">Database not connected, skipping table checks.</p>
          )}
        </section>

        {/* Session cookie */}
        <section className="rounded-2xl border border-zinc-800 bg-white/5 p-5">
          <h2 className="text-lg font-semibold mb-2">Session Cookie</h2>
          <p className="text-sm">
            {hasSessionCookie ? (
              <span className="text-emerald-400">✅ <code>axpt_session</code> cookie detected</span>
            ) : (
              <span className="text-amber-300">⚠️ <code>axpt_session</code> cookie not present</span>
            )}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            This page doesn’t require auth, but detecting the cookie helps debug login/state quickly.
          </p>
        </section>

        {/* Overall */}
        <section className="rounded-2xl border border-zinc-800 bg-white/5 p-5">
          <h2 className="text-lg font-semibold mb-2">Overall</h2>
          {allGood ? (
            <p className="text-sm text-emerald-400">✨ All systems ready for dev checks.</p>
          ) : (
            <p className="text-sm text-amber-300">
              Some checks need attention. Use the notes above to resolve, then refresh this page.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}