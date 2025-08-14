import Link from 'next/link';
import { requireResidentServer } from '@/lib/auth/requireResidentServer';
import { prisma } from '@/lib/prisma';
import { fmtDateTime } from '@/lib/dates';
import StatusBadge from '@/components/ui/StatusBadge';

function decimalToNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object' && typeof (val as any).toNumber === 'function') {
    return (val as any).toNumber();
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

const axgFmt = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default async function ProjectsListPage() {
  const { userId } = await requireResidentServer();

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      requestedAxg: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">My Submissions</h1>
          <Link
            href="/portal/projects/submit"
            prefetch={false}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-purple-500/60 text-sm"
          >
            New submission
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {projects.length === 0 && (
            <p className="text-sm text-zinc-400">No projects yet.</p>
          )}

          {projects.map((p) => {
            const requested = decimalToNumber(p.requestedAxg);

            return (
              <Link
                key={p.id}
                href={`/portal/projects/${p.id}`}
                prefetch={false}
                className="block rounded-xl border border-zinc-800 px-4 py-3 hover:border-purple-500/60"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.title}</div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {fmtDateTime(p.createdAt)} — requested {axgFmt.format(requested)} AXG
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}