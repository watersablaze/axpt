export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PriceBadge from '@/components/chain/PriceBadge';
import { InitiativeStatus } from '@prisma/client';

const fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Include only runtime-present enum values
function buildStatusIn() {
  const desired = ['ACTIVE', 'COMPLETED'] as const;
  const exists = desired.filter((k) => (InitiativeStatus as any)[k]);
  if (exists.length === 0) return undefined;
  return {
    in: exists.map((k) => (InitiativeStatus as any)[k]) as (typeof InitiativeStatus)[keyof typeof InitiativeStatus][],
  };
}

export default async function InitiativesPublicListPage() {
  let items:
    | Array<{ id: string; slug: string; title: string; category: string; status: string; createdAt: Date }>
    = [];
  let totals = new Map<string, number>();

  try {
    items = await prisma.initiative.findMany({
      where: { status: buildStatusIn() },
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, title: true, category: true, status: true, createdAt: true },
    });

    if (items.length) {
      const sums = await prisma.initiativeFunding.groupBy({
        by: ['initiativeId'],
        _sum: { amount: true },
        where: { initiativeId: { in: items.map((i) => i.id) } },
      });
      totals = new Map<string, number>(
        sums.map((s) => [s.initiativeId, (s._sum.amount as any)?.toNumber?.() ?? Number(s._sum.amount) ?? 0]),
      );
    }
  } catch (err) {
    console.error('[initiatives] DB unreachable or query failed:', err);
    // render with empty list; page stays up
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Initiatives</h1>
          <PriceBadge />
        </div>

        <p className="text-sm text-zinc-400 mt-1">Explore current programs and their impact.</p>

        <div className="mt-6 grid gap-3">
          {items.length === 0 && (
            <p className="text-sm text-zinc-500">
              No initiatives yet, or the database is currently unreachable.
            </p>
          )}

          {items.map((i) => {
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