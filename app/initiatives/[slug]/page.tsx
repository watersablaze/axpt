import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PriceBadge from '@/components/chain/PriceBadge';
// import PRTBalancePill from '@/components/chain/PRTBalancePill'; // 🔒 TEMP: Commented out
import PledgeForm from './PledgeForm';
import { InitiativeStatus } from '@prisma/client';

const axgFmt = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

async function getFundingTotal(initiativeId: string) {
  const agg = await prisma.initiativeFunding.aggregate({
    where: { initiativeId },
    _sum: { amount: true },
  });
  return (agg._sum.amount as any)?.toNumber?.() ?? Number(agg._sum.amount) ?? 0;
}

export default async function InitiativePublicDetailPage({ params }: { params: { slug: string } }) {
  const initiative = await prisma.initiative.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      status: true,
      category: true,
      createdAt: true,
      updates: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, body: true, createdAt: true },
      },
    },
  });

  if (!initiative) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-3xl mx-auto px-6 py-12">Not found.</div>
      </main>
    );
  }

  const total = await getFundingTotal(initiative.id);
  const isActive = initiative.status === InitiativeStatus.ACTIVE;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-4">
          <Link
            href="/initiatives"
            className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
          >
            ← Back to initiatives
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{initiative.title}</h1>
          <div className="flex items-center gap-2">
            <PriceBadge />
            {/* <PRTBalancePill /> */}
          </div>
        </div>

        <div className="text-sm text-zinc-400 mt-1">
          {initiative.category} • {initiative.status} • Created {new Date(initiative.createdAt).toLocaleString()}
        </div>

        {!!initiative.summary && (
          <p className="mt-4 text-sm text-zinc-200 whitespace-pre-wrap">{initiative.summary}</p>
        )}

        <div className="mt-6 rounded-lg border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Total pledged</div>
          <div className="text-xl font-semibold">{axgFmt.format(total)} AXG</div>

          <div className="mt-3">
            <PledgeForm slug={initiative.slug} disabled={!isActive} />
          </div>

          {!isActive && (
            <p className="text-xs text-amber-400 mt-2">This initiative is not active for pledges.</p>
          )}
          <p className="text-xs text-zinc-500 mt-2">
            You may need to be signed in as a resident to pledge; otherwise the API will return 401.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Updates</h2>
          <div className="mt-3 space-y-3">
            {initiative.updates.length === 0 && <div className="text-sm text-zinc-500">No updates yet.</div>}
            {initiative.updates.map((u) => (
              <div key={u.id} className="rounded-lg border border-zinc-800 p-3">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{new Date(u.createdAt).toLocaleString()}</span>
                  {u.title && <span className="text-zinc-300">{u.title}</span>}
                </div>
                <div className="text-sm mt-1 text-zinc-200 whitespace-pre-wrap">{u.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}