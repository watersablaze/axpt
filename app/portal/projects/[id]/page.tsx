import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireResidentServer } from '@/lib/auth/requireResidentServer';
import { prisma } from '@/lib/prisma';
import { fmtDateTime } from '@/lib/dates';
import StatusBadge from '@/components/ui/StatusBadge';

function decimalToNumber(d: any): number {
  if (!d && d !== 0) return 0;
  if (typeof d?.toNumber === 'function') return d.toNumber();
  return Number(d);
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await requireResidentServer();

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
    include: {
      reviews: {
        include: { reviewer: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) return notFound();

  const requested = decimalToNumber(project.requestedAxg);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-4">
          <Link
            href="/portal/projects"
            className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
          >
            ← Back to submissions
          </Link>
        </div>

        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <div className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
          <StatusBadge status={project.status} />
          <span>Requested {requested.toFixed(2)} AXG</span>
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          Submitted {fmtDateTime(project.createdAt)}
        </div>

        <p className="mt-4 text-sm text-zinc-200 whitespace-pre-wrap">{project.summary}</p>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Council Notes</h2>
          <div className="mt-3 space-y-2">
            {project.reviews.length === 0 && (
              <p className="text-sm text-zinc-500">No notes yet.</p>
            )}
            {project.reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                <div className="text-xs text-zinc-400">
                  {r.action} — {fmtDateTime(r.createdAt)} •{' '}
                  {r.reviewer?.name || r.reviewer?.email || 'Elder'}
                </div>
                {r.note && <div className="text-sm mt-1 text-zinc-200">{r.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}