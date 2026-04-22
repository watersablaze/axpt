import { prisma } from '@/infrastructure/db/prisma'
import { notFound } from 'next/navigation'
import ActivateButton from './ActivateButton'

export default async function ActivateCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>
}) {
  const { caseId } = await params

  const c = await prisma.case.findUnique({
    where: { id: caseId },
  })

  if (!c) return notFound()

  const canActivate = c.status === 'DRAFT'

  return (
    <section className="px-6 py-10 max-w-xl mx-auto">
      <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">

        {/* HEADER */}
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

        {/* BLOCKED STATE */}
        {!canActivate && (
          <div className="text-sm text-amber-400">
            This case cannot be activated.
            <br />
            Only cases in <strong>DRAFT</strong> may transition to ACTIVE.
          </div>
        )}

        {/* ACTIVATION FLOW */}
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

            <div className="mt-6">
              <ActivateButton caseId={c.id} />
            </div>
          </>
        )}

      </div>
    </section>
  )
}