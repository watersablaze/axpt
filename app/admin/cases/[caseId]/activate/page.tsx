import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function ActivateCasePage({
  params,
}: {
  params: { caseId: string };
}) {
  const c = await prisma.case.findUnique({
    where: { id: params.caseId },
  });

  if (!c) notFound();

  const canActivate = c.status === 'DRAFT';

  return (
    <section className="px-6 py-10 max-w-xl mx-auto">
      <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Activate Case
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          Case: <span className="text-zinc-200">{c.title}</span>
        </p>

        <div className="mt-4 text-sm">
          <strong>Status:</strong> {c.status}
        </div>

        <hr className="my-5 border-zinc-800" />

        {!canActivate && (
          <div className="text-sm text-amber-400">
            This case cannot be activated.
            <br />
            Only cases in <strong>DRAFT</strong> may transition to ACTIVE.
          </div>
        )}

        {canActivate && (
          <>
            <p className="text-sm text-zinc-300">
              Activating this case will:
            </p>

            <ul className="mt-2 list-disc list-inside text-sm text-zinc-400">
              <li>Lock initial case metadata</li>
              <li>Open all gates for verification</li>
              <li>Allow gate progression to begin</li>
            </ul>

            <form
              method="POST"
              action={`/api/axpt/cases/${c.id}/activate`}
              className="mt-6"
            >
              <button
                type="submit"
                className="w-full rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition px-4 py-2 font-semibold"
              >
                Confirm & Activate Case
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}