import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import ReviewAction from './review-action';
import FundButton from './FundButton';

type SearchParams = {
  status?: string; // SUBMITTED | UNDER_REVIEW | APPROVED | DENIED | FUNDED | (blank = all)
  q?: string;      // search title/email
};

function decimalToNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  // @ts-ignore – handle Prisma.Decimal without an import
  if (val && typeof val === 'object' && typeof (val as any).toNumber === 'function') {
    return (val as any).toNumber();
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'FUNDED'] as const;

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  await requireElderServer();

  const status = (searchParams?.status || '').toUpperCase();
  const q = (searchParams?.q || '').trim();

  const where: any = {};
  if (STATUSES.includes(status as any)) {
    where.status = status;
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      requestedAxg: true,
      createdAt: true,
      user: { select: { email: true, name: true } },
    },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Council Intake</h1>
          <Link
            href="/portal/projects"
            className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
          >
            View as resident →
          </Link>
        </div>

        {/* Filters */}
        <form
          action="/admin/projects"
          method="GET"
          className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Status</label>
            <select
              name="status"
              defaultValue={STATUSES.includes(status as any) ? status : ''}
              className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-zinc-400 mb-1">Search (title or resident email)</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="e.g. garden, alice@domain"
              className="w-full rounded-lg bg-black/30 border border-zinc-800 px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-purple-500/60 text-sm"
            >
              Apply
            </button>
            <Link
              href="/admin/projects"
              className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 text-sm"
            >
              Reset
            </Link>
          </div>
        </form>

        {/* Table */}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-800/70">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Resident</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-zinc-400" colSpan={6}>
                    Nothing found.
                  </td>
                </tr>
              )}

              {projects.map((p) => {
                const requested = decimalToNumber(p.requestedAxg);
                const canFund = p.status === 'APPROVED';

                return (
                  <tr key={p.id} className="border-t border-zinc-800/70">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-zinc-500">
                        <Link
                          href={`/portal/projects/${p.id}`}
                          className="underline underline-offset-4 hover:text-zinc-300"
                        >
                          resident view
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div>{p.user?.name || '—'}</div>
                      <div className="text-xs text-zinc-500">{p.user?.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3 align-top">{requested.toFixed(2)} AXG</td>
                    <td className="px-4 py-3 align-top">
                      <span className="text-xs text-zinc-300">{p.status}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="text-xs text-zinc-400">
                        {new Date(p.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <ReviewAction projectId={p.id} />
                        {canFund && <FundButton projectId={p.id} amount={requested} />}
                      </div>
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