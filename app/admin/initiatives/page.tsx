// app/admin/initiatives/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

function StatusPill({ s }: { s: string }) {
  const color =
    s === 'ACTIVE'
      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-700/50'
      : s === 'PAUSED'
      ? 'bg-amber-600/20 text-amber-300 border-amber-700/50'
      : s === 'COMPLETED'
      ? 'bg-blue-600/20 text-blue-300 border-blue-700/50'
      : s === 'ARCHIVED'
      ? 'bg-zinc-700/30 text-zinc-300 border-zinc-700/60'
      : 'bg-zinc-700/30 text-zinc-200 border-zinc-700/60';
  return <span className={`text-[11px] px-2 py-0.5 rounded-md border ${color}`}>{s}</span>;
}

const axg = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AdminInitiativesPage({
  searchParams,
}: {
  searchParams?: { status?: string; category?: string };
}) {
  await requireElderServer();

  const where: any = {};
  if (searchParams?.status) where.status = searchParams.status;
  if (searchParams?.category) where.category = searchParams.category;

  const items = await prisma.initiative.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      status: true,
      createdAt: true,
    },
  });

  // Compute pledged totals in one query for the listed initiatives
  let totals = new Map<string, number>();
  if (items.length > 0) {
    const sums = await prisma.initiativeFunding.groupBy({
      by: ['initiativeId'],
      _sum: { amount: true },
      where: { initiativeId: { in: items.map(i => i.id) } },
    });
    totals = new Map(
      sums.map(s => [
        s.initiativeId,
        (s._sum.amount as any)?.toNumber?.() ?? Number(s._sum.amount) ?? 0,
      ]),
    );
  }

  const statuses = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'];
  const categories = ['ENERGY', 'FINTECH', 'DATA', 'SECURITY', 'OTHER'];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Initiatives</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/settings"
              prefetch={false}
              className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60"
            >
              Council Settings
            </Link>
          </div>
        </div>

        {/* Filters */}
        <form className="mt-6 flex flex-wrap gap-2 text-sm">
          <select
            name="status"
            defaultValue={searchParams?.status || ''}
            className="px-2 py-1 rounded-md bg-black/30 border border-zinc-800"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={searchParams?.category || ''}
            className="px-2 py-1 rounded-md bg-black/30 border border-zinc-800"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60">
            Apply
          </button>
        </form>

        {/* Table */}
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/50 text-zinc-300">
              <tr>
                <th className="text-left px-3 py-2 border-b border-zinc-800">Title</th>
                <th className="text-left px-3 py-2 border-b border-zinc-800">Slug</th>
                <th className="text-left px-3 py-2 border-b border-zinc-800">Category</th>
                <th className="text-left px-3 py-2 border-b border-zinc-800">Status</th>
                <th className="text-right px-3 py-2 border-b border-zinc-800">Pledged (AXG)</th>
                <th className="text-left px-3 py-2 border-b border-zinc-800">Created</th>
                <th className="text-right px-3 py-2 border-b border-zinc-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-zinc-500 text-center">
                    No initiatives found.
                  </td>
                </tr>
              )}
              {items.map(i => {
                const pledged = totals.get(i.id) ?? 0;
                return (
                  <tr key={i.id} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-2">{i.title}</td>
                    <td className="px-3 py-2 text-zinc-400">{i.slug}</td>
                    <td className="px-3 py-2 text-zinc-300">{i.category}</td>
                    <td className="px-3 py-2">
                      <StatusPill s={i.status} />
                    </td>
                    <td className="px-3 py-2 text-right">{axg.format(pledged)}</td>
                    <td className="px-3 py-2 text-zinc-400">{new Date(i.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/initiatives/${i.slug}`}
                        prefetch={false}
                        className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 hover:border-purple-500/60"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}