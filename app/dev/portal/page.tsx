// app/dev/portal/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DevBanner from '@/components/dev/DevBanner';
import ResidentPicker from './ResidentPicker';
import SendAxgForm from './SendAxgForm';
import { cookies } from 'next/headers';
import DevImpersonateStrip from './DevImpersonateStrip';

export default async function DevPortalPreview() {
  if (process.env.NODE_ENV === 'production') redirect('/portal');

  // Prefer the dev impersonation cookie over any real app session
  const cookieStore = await cookies();
  const sessionEmail =
    cookieStore.get('dev_impersonate_email')?.value ??
    cookieStore.get('axpt_session_email')?.value ??
    null;

  // Be defensive: user may not exist if someone cleared DB
  const user =
    sessionEmail
      ? await prisma.user.findUnique({
          where: { email: sessionEmail },
          select: { id: true, name: true, email: true, tier: true },
        })
      : await prisma.user.findFirst({
          select: { id: true, name: true, email: true, tier: true },
        });

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-xl">No users yet</h1>
          <p className="text-sm text-zinc-400">
            Hit <code>/api/dev/reseed-residents?force=1</code> to seed A/B and reload.
          </p>
        </div>
      </main>
    );
  }

  // Wallet + balances + chain stub (best-effort)
  const wallet = await prisma.wallet.findFirst({
    where: { userId: user.id },
    include: {
      balances: { include: { token: true } },
      blockchainWallet: true,
    },
    orderBy: { id: 'asc' },
  }).catch(() => null);

  const balances =
    (wallet?.balances ?? [])
      .map(b => ({
        label: b.token ? b.token.symbol : b.tokenType ?? '—',
        amount: b.amount,
      }))
      .sort((a, b) =>
        a.label === 'AXG' ? -1 : b.label === 'AXG' ? 1 : a.label.localeCompare(b.label)
      );

  // Recent on-ledger activity (if present)
  const txns = wallet
    ? await prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          tokenType: true,
          createdAt: true,
          metadata: true,
        },
      }).catch(() => [])
    : [];

  // Council / issuance summaries (best-effort; tables may not exist yet)
  let proposals: any[] = [];
  let issuance: any[] = [];
  try {
    proposals = await prisma.governanceProposal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        readyAt: true,
        votingEndsAt: true,
        quorum: true,
        approvalThreshold: true,
      },
    });
    issuance = await prisma.tokenIssuanceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        symbol: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });
  } catch {
    // swallow for fresh DBs
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white">
      <DevBanner note="DEV Portal Preview — hidden in production" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(136,96,208,0.18),transparent_60%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Status chip / quick actions */}
        <div className="mb-6">
          <DevImpersonateStrip currentEmail={sessionEmail ?? user.email ?? null} />
        </div>

        {/* Header */}
        <section className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            (DEV) Welcome {user.name || 'Resident'}
          </h1>
          <p className="mt-2 text-zinc-300">
            Viewing as <span className="text-purple-300">{user.email}</span>
          </p>
          <div className="mt-3 text-sm text-zinc-400">
            {user.tier && <p>Tier: <span className="text-zinc-200">{user.tier}</span></p>}
          </div>
        </section>

        {/* Wallet + Paths */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-xl font-semibold">Wallet</h2>
            {wallet ? (
              <>
                <p className="mt-1 text-zinc-400 text-sm">
                  On‑chain Address:{' '}
                  <span className="text-zinc-200">{wallet.blockchainWallet?.address ?? '—'}</span>
                </p>
                <div className="mt-4 space-y-2">
                  {balances.length === 0 ? (
                    <p className="text-sm text-zinc-400">No balances yet.</p>
                  ) : (
                    balances.map((b, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-2">
                        <span className="text-sm">{b.label}</span>
                        <span className="text-sm text-zinc-200">{b.amount.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">No wallet on file yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-xl font-semibold">Paths Now Open</h2>
            <div className="mt-4 grid gap-3">
              <Tile label="Submit a Project" href="/portal/projects/submit" subtle="Propose an initiative to the Council." />
              <Tile label="Browse Initiatives" href="/portal/projects" subtle="Witness active constellations across AXPT." />
              <Tile label="Telecom Profile (NLX)" href="/portal/telecom" subtle="Activate your SIM‑bound presence." />
              <Tile label="Shadow Vault" href="/portal/vault" subtle="Enter with care. High‑honor records live here." />
            </div>
          </div>
        </section>

        {/* Council */}
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <CouncilCard proposals={proposals} />
          <IssuanceCard issuance={issuance} />
        </section>

        {/* Send AXG + TXs + Picker */}
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <TransactionsCard txns={txns} />
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
              <h2 className="text-xl font-semibold">Send AXG (DEV)</h2>
              <p className="text-xs text-zinc-400 mt-1">Transfer as the currently impersonated resident.</p>
              {wallet ? (
                <div className="mt-4">
                  <SendAxgForm />
                </div>
              ) : (
                <p className="text-sm text-zinc-400 mt-3">No wallet found. Run reseed first.</p>
              )}
            </div>

            {/* Optional: bigger picker panel */}
            <ResidentPicker />
          </div>
        </section>
      </div>
    </main>
  );
}

function CouncilCard({ proposals }: { proposals: any[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
      <h2 className="text-xl font-semibold">Council Proposals</h2>
      <p className="text-xs text-zinc-400 mt-1">Witness the movements of the Elders.</p>
      <div className="mt-4 space-y-2">
        {proposals.length === 0 && <p className="text-sm text-zinc-400">No proposals yet.</p>}
        {proposals.map((p) => (
          <div key={p.id} className="rounded-xl border border-zinc-800 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.title}</div>
              <span className="text-xs text-zinc-400">{p.status}</span>
            </div>
            {p.readyAt && <div className="text-xs text-emerald-400 mt-1">Ready at {new Date(p.readyAt).toLocaleString()}</div>}
            {p.votingEndsAt && <div className="text-xs text-zinc-500">Voting ends {new Date(p.votingEndsAt).toLocaleString()}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function IssuanceCard({ issuance }: { issuance: any[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
      <h2 className="text-xl font-semibold">Token Issuance</h2>
      <p className="text-xs text-zinc-400 mt-1">Seeds awaiting the Council’s blessing.</p>
      <div className="mt-4 space-y-2">
        {issuance.length === 0 && <p className="text-sm text-zinc-400">No requests yet.</p>}
        {issuance.map((r) => (
          <div key={r.id} className="rounded-xl border border-zinc-800 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.symbol} — {r.name}</div>
              <span className="text-xs text-zinc-400">{r.status}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">{new Date(r.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionsCard({
  txns,
}: {
  txns: Array<{ id: string; type: string; amount: number; tokenType: string | null; createdAt: Date; metadata: any; }>;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
      <h2 className="text-xl font-semibold">Recent Activity</h2>
      <p className="text-xs text-zinc-400 mt-1">Latest 10 transactions.</p>
      <div className="mt-4 space-y-2">
        {txns.length === 0 && <p className="text-sm text-zinc-400">No activity yet.</p>}
        {txns.map((t) => (
          <div key={t.id} className="rounded-2xl border border-zinc-800 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{t.type.toUpperCase()}</span>
                <span className="mx-2 opacity-60">•</span>
                <span>{t.tokenType ?? '—'}</span>
              </div>
              <div className="text-sm text-zinc-200">{t.amount.toFixed(2)}</div>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {new Date(t.createdAt).toLocaleString()}
              {t.metadata?.note ? <span className="ml-2 text-zinc-400">— {t.metadata.note}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({ label, href, subtle }: { label: string; href: string; subtle?: string }) {
  return (
    <a href={href} className="block rounded-xl border border-zinc-800 hover:border-purple-500/60 bg-black/30 hover:bg-purple-500/10 transition px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-sm opacity-70">→</span>
      </div>
      {subtle && <p className="mt-1 text-xs text-zinc-400">{subtle}</p>}
    </a>
  );
}