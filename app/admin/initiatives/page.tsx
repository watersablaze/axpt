// app/admin/initiatives/page.tsx
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

type SearchParams = { page?: string; limit?: string };

const CATEGORIES = ['ENERGY', 'FINTECH', 'DATA', 'SECURITY', 'OTHER'] as const;
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700',
  ACTIVE: 'bg-emerald-600/90 text-white ring-1 ring-emerald-400/50',
  PAUSED: 'bg-amber-600/90 text-white ring-1 ring-amber-400/50',
  COMPLETED: 'bg-indigo-700/90 text-white ring-1 ring-indigo-400/50',
  ARCHIVED: 'bg-zinc-900 text-zinc-300 ring-1 ring-zinc-700',
};

function fmtEth(n: number) {
  if (!isFinite(n)) return 'Ξ 0.00';
  return `Ξ ${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

function fmtDate(d: Date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
    }).format(new Date(d));
  } catch {
    return String(d);
  }
}

function toNum(v: unknown): number {
  try {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'bigint') return Number(v);
    // Prisma Decimal
    // @ts-ignore
    if (typeof v?.toNumber === 'function') return v.toNumber();
    return Number(v);
  } catch {
    return 0;
  }
}

export default async function InitiativesAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireElderServer();

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.limit ?? 20)));
  const skip = (page - 1) * limit;

  const [initiatives, totalCount] = await Promise.all([
    prisma.initiative.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        status: true,
        createdAt: true,
      },
      skip,
      take: limit,
    }),
    prisma.initiative.count(),
  ]);

  const totals = await prisma.initiativeFunding.groupBy({
    by: ['initiativeId'],
    _sum: { amount: true },
    where: { initiativeId: { in: initiatives.map((i) => i.id) } },
  });

  const totalsMap = new Map<string, number>();
  for (const t of totals) {
    totalsMap.set(t.initiativeId, toNum(t._sum.amount));
  }

  const items = initiatives.map((i) => ({
    ...i,
    fundingReceived: totalsMap.get(i.id) ?? 0,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide">Initiatives</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {totalCount} total • page {page} of {totalPages}
            </p>
          </div>
          <Link
            href="/admin/initiatives/new"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold tracking-wide hover:border-purple-500/60"
          >
            + New Initiative
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
          <table className="min-w-full border-collapse">
            <thead className="bg-zinc-950/70">
              <tr className="text-left text-sm text-zinc-300">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Funding Received</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">
                    No initiatives yet. Create the first one.
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr
                    key={i.id}
                    className="border-t border-zinc-900/60 hover:bg-zinc-900/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/initiatives/${i.slug}`}
                          className="font-medium tracking-wide text-zinc-100 hover:text-purple-300"
                        >
                          {i.title}
                        </Link>
                        <span className="mt-0.5 text-xs text-zinc-500">
                          /admin/initiatives/{i.slug}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-semibold tracking-wide text-zinc-200 ring-1 ring-zinc-700">
                        {CATEGORIES.includes(i.category as any) ? i.category : 'OTHER'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${STATUS_COLORS[i.status] || STATUS_COLORS.DRAFT
                          }`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{fmtDate(i.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold tracking-wide">
                      {fmtEth(i.fundingReceived)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Showing {(skip + 1)}–{Math.min(skip + limit, totalCount)} of {totalCount}
          </div>
          <div className="flex gap-2">
            <PageLink page={page - 1} limit={limit} disabled={page <= 1}>
              ← Prev
            </PageLink>
            <PageLink page={page + 1} limit={limit} disabled={page >= totalPages}>
              Next →
            </PageLink>
          </div>
        </div>
      </div>
    </main>
  );
}

function PageLink({
  page,
  limit,
  disabled,
  children,
}: {
  page: number;
  limit: number;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const href = `/admin/initiatives?page=${page}&limit=${limit}`;
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-500">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:border-purple-500/60"
    >
      {children}
    </Link>
  );
}