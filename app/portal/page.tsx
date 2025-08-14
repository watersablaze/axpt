// app/portal/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireResidentServer } from '@/lib/auth/requireResidentServer';
import SendAxgForm from './SendAxgForm';

export default async function PortalHome() {
  const { user, userId } = await requireResidentServer();

  const [wallet, proposals, issuance] = await Promise.all([
    prisma.wallet.findFirst({
      where: { userId },
      include: {
        balances: { include: { token: true } },
        blockchainWallet: true,
      },
      orderBy: { id: 'asc' },
    }).catch(() => null),
    prisma.governanceProposal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, title: true, status: true, createdAt: true,
        quorum: true, approvalThreshold: true, readyAt: true, votingEndsAt: true,
      },
    }).catch(() => []),
    prisma.tokenIssuanceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, symbol: true, name: true, status: true, createdAt: true },
    }).catch(() => []),
  ]);

  const balances = (wallet?.balances ?? [])
    .map(b => ({
      label: b.token ? b.token.symbol : (b.tokenType ?? '—'),
      amount: b.amount,
    }))
    .sort((a, b) => (a.label === 'AXG' ? -1 : b.label === 'AXG' ? 1 : a.label.localeCompare(b.label)));

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(136,96,208,0.18),transparent_60%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Welcome Ring */}
        <section className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Welcome {user?.name || 'Resident'}
          </h1>
          <p className="mt-2 text-zinc-300">You are inside the Circle. Move gently, act with precision.</p>
          <div className="mt-3 text-sm text-zinc-400">
            {user?.email && <p>Identity: <span className="text-zinc-200">{user.email}</span></p>}
            {user?.tier && <p>Tier: <span className="text-zinc-200">{user.tier}</span></p>}
          </div>
        </section>

        {/* Wallet & Paths */}
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
                  ) : balances.map((b, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-2">
                      <span className="text-sm">{b.label}</span>
                      <span className="text-sm text-zinc-200">{b.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Send AXG inline */}
                <div className="mt-6 border-t border-zinc-800/70 pt-4">
                  <h3 className="text-sm font-medium mb-2">Send AXG</h3>
                  <SendAxgForm />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">No wallet on file yet.</p>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              AXG appears first. DAO tokens will reveal themselves as they are granted.
            </p>
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

        {/* Witness the Council */}
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-xl font-semibold">Council Proposals</h2>
            <p className="text-xs text-zinc-400 mt-1">Witness the movements of the Elders.</p>
            <div className="mt-4 space-y-2">
              {proposals.length === 0 && <p className="text-sm text-zinc-400">No proposals yet.</p>}
              {proposals.map(p => (
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
            <p className="text-xs text-zinc-500 mt-3">Timelocks protect the Circle with a breath between approval and action.</p>
          </div>

          <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-xl font-semibold">Token Issuance</h2>
            <p className="text-xs text-zinc-400 mt-1">Seeds awaiting the Council’s blessing.</p>
            <div className="mt-4 space-y-2">
              {issuance.length === 0 && <p className="text-sm text-zinc-400">No requests yet.</p>}
              {issuance.map(r => (
                <div key={r.id} className="rounded-xl border border-zinc-800 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.symbol} — {r.name}</div>
                    <span className="text-xs text-zinc-400">{r.status}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-3">When tokens are minted, they’ll reveal as balances in your wallet.</p>
          </div>
        </section>

        {/* Guardian presence */}
        <div className="fixed right-4 bottom-4 flex items-center gap-2 opacity-80">
          <span className="relative inline-flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-400" />
          </span>
          <span className="text-xs text-zinc-400">Guardian online</span>
        </div>
      </div>
    </main>
  );
}

function Tile({ label, href, subtle }: { label: string; href: string; subtle?: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-zinc-800 hover:border-purple-500/60 bg-black/30 hover:bg-purple-500/10 transition px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-sm opacity-70">→</span>
      </div>
      {subtle && <p className="mt-1 text-xs text-zinc-400">{subtle}</p>}
    </Link>
  );
}