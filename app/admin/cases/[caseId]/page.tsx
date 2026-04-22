import { prisma } from '@/infrastructure/db/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CaseProgressionBar from '@/components/case/CaseProgressionBar'
import { resolveCouncil } from '@/core/automation/council'
import type { Gate } from '@prisma/client'

export default async function CaseDashboard({
  params,
}: {
  params: Promise<{ caseId: string }>
}) {
  const { caseId } = await params

  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      gates: {
        orderBy: { ord: 'asc' },
        include: { items: true },
      },
      artifacts: {
        orderBy: { createdAt: 'desc' },
      },
      events: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!c) notFound()

  // =========================
  // DERIVED STATE
  // =========================
  const allVerified =
    c.gates.length > 0 &&
    c.gates.every((g: Gate) => g.status === 'VERIFIED')

  const verifiedCount = c.gates.filter(
    (g: Gate) => g.status === 'VERIFIED'
  ).length

let nextAction = 'MONITORING'

if (c.gates.length === 0) {
  nextAction = 'AWAITING_GATES'

} else if (!allVerified) {
  nextAction = 'AWAITING_VERIFICATION'

} else if (c.status === 'ESCROW_HOLD') {
  nextAction = 'ESCROW_ON_HOLD'

} else if (c.status === 'ESCROW_DISPUTED') {
  nextAction = 'ESCROW_DISPUTED'

} else if (allVerified && c.status !== 'ESCROW_INITIATED') {
  nextAction = 'LOCK_ESCROW'

} else if (c.status === 'ESCROW_INITIATED') {
  nextAction = 'ESCROW_ACTIVE'
}

  // =========================
  // COUNCIL (TEMP EMPTY)
  // =========================
  const operators: any[] = []
  const council = resolveCouncil(operators)

  const confidence = council.confidence ?? 0

  // =========================
  // INFLUENCE
  // =========================
  const human = council.signals?.human ?? 0
  const system = council.signals?.system ?? 0
  const total = human + system || 1

  const humanPct = (human / total) * 100
  const systemPct = (system / total) * 100

  // =========================
  // TONE
  // =========================
const tone =
  nextAction === 'AWAITING_GATES'
    ? 'Blocked — no verification structure'
    : nextAction === 'AWAITING_VERIFICATION'
    ? 'Awaiting verification'
    : nextAction === 'LOCK_ESCROW'
    ? 'System aligned — ready for escrow'
    : nextAction === 'ESCROW_ACTIVE'
    ? 'Escrow active — monitoring settlement'
    : nextAction === 'ESCROW_ON_HOLD'
    ? 'Escrow paused — awaiting intervention'
    : nextAction === 'ESCROW_DISPUTED'
    ? 'Escrow disputed — investigation required'
    : confidence < 0.5
    ? 'System unstable'
    : confidence < 0.65
    ? 'System uncertain'
    : 'Monitoring'

  // =========================
  // UI
  // =========================
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

      {/* SYSTEM INTELLIGENCE */}
      <div className="border border-neutral-800 rounded-lg p-4 space-y-3">

        <div className="text-xs text-neutral-500 uppercase">
          System Intelligence
        </div>

        {/* 🔥 SETTLEMENT CONTROLS */}
        {(c.status === "ESCROW_INITIATED" || c.status === "ESCROW_HOLD") && (
          <div className="flex gap-3">

            <form method="POST" action={`/api/axpt/cases/${c.id}/escrow/release`}>
              <button className="px-4 py-2 bg-emerald-600 rounded text-sm">
                Release
              </button>
            </form>

            <form method="POST" action={`/api/axpt/cases/${c.id}/escrow/hold`}>
              <button className="px-4 py-2 bg-yellow-600 rounded text-sm">
                Hold
              </button>
            </form>

            <form method="POST" action={`/api/axpt/cases/${c.id}/escrow/dispute`}>
              <button className="px-4 py-2 bg-red-600 rounded text-sm">
                Dispute
              </button>
            </form>

          </div>
        )}

        {nextAction === "LOCK_ESCROW" && (
        <form
          method="POST"
          action={`/api/axpt/cases/${c.id}/escrow/lock`}
          className="mt-4"
        >
          <button
            type="submit"
            className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-sm"
          >
            Lock Escrow
          </button>
        </form>
      )}

        <div className="text-sm text-emerald-400">
          AXPT: {tone}
        </div>

        {/* Influence */}
        <div className="space-y-1">
          <div className="text-[10px] text-neutral-500">
            Influence
          </div>

          <div className="flex h-1.5 rounded overflow-hidden bg-neutral-800">
            <div
              className="bg-emerald-400"
              style={{ width: `${humanPct}%` }}
            />
            <div
              className="bg-cyan-400"
              style={{ width: `${systemPct}%` }}
            />
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between text-xs text-neutral-400">

          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                confidence > 0.75
                  ? 'bg-emerald-400'
                  : confidence > 0.5
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
              }`}
            />
            {(confidence * 100).toFixed(0)}%
          </div>

          <span>{nextAction}</span>
        </div>

        {confidence < 0.65 && (
          <div className="text-yellow-400 text-xs animate-pulse">
            ⚠ Awaiting stronger signal
          </div>
        )}
      </div>

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">
          {c.title}
        </h1>

        <div className="text-sm text-neutral-400 flex gap-4">
          <span>Status: {c.status}</span>
          <span>Mode: {c.mode}</span>
          <span>ID: {c.id.slice(0, 10)}</span>
        </div>
      </div>

      {/* STATE STRIP */}
      <div className="grid grid-cols-3 gap-4 text-sm">

        <div className="p-4 border border-neutral-800 rounded-lg">
          <div className="text-xs text-neutral-500">GATES</div>
          <div className="text-lg">
            {verifiedCount} / {c.gates.length}
          </div>
        </div>

        <div className="p-4 border border-neutral-800 rounded-lg">
          <div className="text-xs text-neutral-500">ARTIFACTS</div>
          <div className="text-lg">
            {c.artifacts.length}
          </div>
        </div>

        <div className="p-4 border border-neutral-800 rounded-lg">
          <div className="text-xs text-neutral-500">ESCROW</div>
        <div className="text-lg">
          {c.status === 'ESCROW_INITIATED'
            ? 'INITIATED'
            : c.status === 'ESCROW_HOLD'
            ? 'ON HOLD'
            : c.status === 'ESCROW_DISPUTED'
            ? 'DISPUTED'
            : 'NOT LOCKED'}
        </div>
          <div className="text-xs text-purple-400">
          DEBUG STATUS: {c.status}
        </div>
        </div>

      </div>

      {/* PROGRESSION */}
      <CaseProgressionBar
        caseData={{
          status: c.status,
          gates: c.gates.map((g) => ({
            id: g.id,
            ord: g.ord,
            name: g.name,
            status: g.status,
          })),
        }}
      />

      {/* GATES */}
<section className="space-y-3">
  {c.gates.map((g) => (
    <div
      key={g.id}
      className="border border-neutral-800 p-4 rounded-lg flex justify-between items-center"
    >
      <div>
        <div>
          Gate {g.ord}: {g.name}
        </div>
        <div className="text-xs text-neutral-500">
          {g.status}
        </div>
      </div>

      {/* 🔥 VERIFY BUTTON */}
      {g.status !== "VERIFIED" && (
        <form
          method="POST"
          action={`/api/axpt/cases/${c.id}/gates/${g.id}/verify`}
        >
          <button
            type="submit"
            className="text-xs px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
          >
            Verify
          </button>
        </form>
      )}

      {g.status === "VERIFIED" && (
        <span className="text-xs text-emerald-400">
          ✓ Verified
        </span>
      )}
    </div>
  ))}
</section>

    </div>
  )
}