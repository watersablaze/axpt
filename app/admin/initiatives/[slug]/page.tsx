import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import Link from 'next/link';

// client islands
import UpdateComposer from './update-composer';
// import PRTBalancePill from '@/components/chain/PRTBalancePill'; // 🔒 TEMP: Commented out for now
import AXGBalancePill from '@/components/chain/AXGBalancePill';
import AXGPricePill from '@/components/chain/AXGPricePill';
import AXGStatusTile from '@/components/chain/AXGStatusTile';
import AXGDepositSimulator from '@/components/chain/AXGDepositSimulator';
import MintButtonMini from '@/components/admin/MintButtonMini';
import CollateralRatioControl from '@/components/admin/CollateralRatioControl';

export default async function AdminInitiativeDetailPage({ params }: { params: { slug: string } }) {
  await requireElderServer();

  const initiative = await prisma.initiative.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      category: true,
      createdAt: true,
      updates: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, body: true, createdAt: true },
      },
    },
  });

  const defaultTo = process.env.NEXT_PUBLIC_TEST_ACCOUNT || '';

  let currentBps: number | null = null;
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/axg/status`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.collateralRatioBps != null) currentBps = Number(json.collateralRatioBps);
    }
  } catch {
    // Safe fail
  }

  if (!initiative) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link href="/admin/initiatives" className="text-xs text-zinc-400 underline">
            ← Back
          </Link>
          <div className="mt-6 text-red-300">Not found.</div>
          <div className="mt-6 space-y-3">
            <div className="text-sm font-semibold">Quick Mint</div>
            <MintButtonMini endpoint="/api/admin/protium/mint" defaultTo={defaultTo} defaultAmount={250} label="Mint PRT" />
            <MintButtonMini endpoint="/api/admin/axg/mint" defaultTo={defaultTo} defaultAmount={25} label="Mint AXG" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href="/admin/initiatives" className="text-xs text-zinc-400 underline">
              ← Back
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">{initiative.title}</h1>
            <div className="text-sm text-zinc-400">
              {initiative.category} • {initiative.status} • Created {new Date(initiative.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {/* <PRTBalancePill account={defaultTo} withUSD /> */}
              <AXGBalancePill account={defaultTo} withUSD />
              <AXGPricePill />
            </div>
            <div className="flex items-center gap-2">
              <MintButtonMini endpoint="/api/admin/protium/mint" defaultTo={defaultTo} defaultAmount={250} label="Mint PRT" />
              <MintButtonMini endpoint="/api/admin/axg/mint" defaultTo={defaultTo} defaultAmount={25} label="Mint AXG" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-7 space-y-6">
            <section className="rounded-lg border border-zinc-800 p-4">
              <h2 className="text-lg font-semibold">Post an Update</h2>
              <p className="text-xs text-zinc-400">Title optional; body required.</p>
              <div className="mt-3">
                <UpdateComposer slug={initiative.slug} />
              </div>
            </section>

            <section className="rounded-lg border border-zinc-800">
              <div className="border-b border-zinc-800 p-4">
                <h2 className="text-lg font-semibold">Recent Updates</h2>
              </div>
              <div className="space-y-3 p-4">
                {initiative.updates.length === 0 && <div className="text-sm text-zinc-500">No updates yet.</div>}
                {initiative.updates.map((u) => (
                  <div key={u.id} className="rounded-md border border-zinc-800 p-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{new Date(u.createdAt).toLocaleString()}</span>
                      {u.title && <span className="text-zinc-300">{u.title}</span>}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{u.body}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="md:col-span-5 space-y-6">
            <AXGStatusTile />
            <AXGDepositSimulator />
            <CollateralRatioControl currentBps={currentBps} />
            <section className="rounded-lg border border-zinc-800 p-4">
              <h2 className="text-lg font-semibold">Test Mint</h2>
              <p className="text-xs text-zinc-400">Owner-guarded mints from the council signer; Sepolia only.</p>
              <div className="mt-3 space-y-2">
                <MintButtonMini endpoint="/api/admin/protium/mint" defaultTo={defaultTo} defaultAmount={500} label="Mint PRT" />
                <MintButtonMini endpoint="/api/admin/axg/mint" defaultTo={defaultTo} defaultAmount={50} label="Mint AXG" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}