import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import Link from 'next/link';

// client islands
import UpdateComposer from './update-composer';
import AXGBalancePill from '@/components/chain/AXGBalancePill';
import PRTBalancePill from '@/components/chain/PRTBalancePill';
import AXGPricePill from '@/components/chain/AXGPricePill';
import AXGStatusTile from '@/components/chain/AXGStatusTile';
import AXGCollateralSetter from '@/components/chain/AXGCollateralSetter';
import AXGDepositSimulator from '@/components/chain/AXGDepositSimulator';
import MintButtonMini from '@/components/admin/MintButtonMini';

export default async function AdminInitiativeDetailPage({ params }: { params: { slug: string } }) {
  await requireElderServer();

  const initiative = await prisma.initiative.findUnique({
    where: { slug: params.slug },
    select: {
      id: true, slug: true, title: true, status: true, category: true, createdAt: true,
      updates: { orderBy: { createdAt: 'desc' }, select: { id: true, title: true, body: true, createdAt: true } },
    },
  });

  const defaultTo = process.env.NEXT_PUBLIC_TEST_ACCOUNT || '';

  if (!initiative) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link href="/admin/initiatives" className="text-xs text-zinc-400 underline">← Back</Link>
          <div className="mt-6 text-red-300">Not found.</div>
          <div className="mt-6 space-y-3">
            <div className="text-sm font-semibold">Quick Mint</div>
            <MintButtonMini endpoint="/api/admin/protium/mint" defaultTo={defaultTo} defaultAmount={250} label="Mint PRT" />
            <MintButtonMini endpoint="/api/admin/axg/mint" defaultTo={defaultTo} defaultAmount={25}  label="Mint AXG" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/admin/initiatives" className="text-xs text-zinc-400 underline">← Back</Link>
            <h1 className="text-2xl font-semibold mt-2">{initiative.title}</h1>
            <div className="text-sm text-zinc-400">
              {initiative.category} • {initiative.status} • Created {new Date(initiative.createdAt).toLocaleString()}
            </div>
          </div>
          {/* quick test mints in header, optional */}
          <div className="hidden md:flex items-center gap-2">
            <MintButtonMini endpoint="/api/admin/protium/mint" defaultTo={defaultTo} defaultAmount={250} label="Mint PRT" />
            <MintButtonMini endpoint="/api/admin/axg/mint"     defaultTo={defaultTo} defaultAmount={25}  label="Mint AXG" />
          </div>
        </div>

        {/* 2-column grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-lg border border-zinc-800 p-4">
              <h2 className="text-lg font-semibold">Post an Update</h2>
              <p className="text-xs text-zinc-400">Title optional; body required.</p>
              <div className="mt-3">
                <UpdateComposer slug={initiative.slug} />
              </div>
            </section>

            <section className="rounded-lg border border-zinc-800">
              <div className="p-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold">Recent Updates</h2>
              </div>
              <div className="p-4 space-y-3">
                {initiative.updates.length === 0 && (
                  <div className="text-sm text-zinc-500">No updates yet.</div>
                )}
                {initiative.updates.map(u => (
                  <div key={u.id} className="rounded-md border border-zinc-800 p-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{new Date(u.createdAt).toLocaleString()}</span>
                      {u.title && <span className="text-zinc-300">{u.title}</span>}
                    </div>
                    <div className="text-sm mt-1 text-zinc-200 whitespace-pre-wrap">
                      {u.body}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: 1/3 width */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <PRTBalancePill account={defaultTo} withUSD />
              <AXGBalancePill account={defaultTo} withUSD />
              <AXGPricePill />
            </div>

            <AXGStatusTile />
            <AXGCollateralSetter />
            <AXGDepositSimulator />

            <div className="space-y-2">
              <MintButtonMini endpoint="/api/admin/protium/mint" defaultTo={defaultTo} defaultAmount={250} label="Mint PRT" />
              <MintButtonMini endpoint="/api/admin/axg/mint"     defaultTo={defaultTo} defaultAmount={25}  label="Mint AXG" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}