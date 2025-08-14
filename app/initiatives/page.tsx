// app/initiatives/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

// fmt helper (keeps things consistent without pulling extra utils)
const fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function InitiativesPublicListPage() {
  // 1) Get initiatives
  const items = await prisma.initiative.findMany({
    where: { status: { in: ['ACTIVE', 'COMPLETED'] as any } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, slug: true, title: true, category: true, status: true, createdAt: true },
  });

  // 2) Fetch all totals in ONE query and map by initiativeId
  const sums = await prisma.initiativeFunding.groupBy({
    by: ['initiativeId'],
    _sum: { amount: true },
    where: { initiativeId: { in: items.map(i => i.id) } },
  });

  const totals = new Map<string, number>(
    sums.map(s => [s.initiativeId, (s._sum.amount as any)?.toNumber?.() ?? Number(s._sum.amount) ?? 0])
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold">Initiatives</h1>
        <p className="text-sm text-zinc-400 mt-1">Explore current programs and their impact.</p>

        <div className="mt-6 grid gap-3">
          {items.length === 0 && <p className="text-sm text-zinc-500">No initiatives yet.</p>}

          {items.map(i => {
            const pledged = totals.get(i.id) ?? 0;

            return (
              <Link
                key={i.id}
                href={`/initiatives/${i.slug}`}
                className="block rounded-lg border border-zinc-800 p-4 hover:border-purple-500/60"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{i.title}</div>
                  <div className="text-xs text-zinc-400">{i.status}</div>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {i.category} • {new Date(i.createdAt).toLocaleString()}
                </div>

                <div className="mt-2 text-xs text-zinc-400">
                  Pledged: <span className="text-zinc-200">{fmt.format(pledged)} AXG</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}