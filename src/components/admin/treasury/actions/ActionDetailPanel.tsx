'use client'

import { useState } from 'react'

type TreasuryApproval = {
  id: string
  approverUserId: string
  decision: string
}

type TreasuryAction = {
  id: string
  assetCode: string
  amountBaseUnits: string | number | bigint | { toString(): string }
  intent: string
  status: string
  approvals: TreasuryApproval[]
}

type ExecutionQueue = {
  status: string
  retryCount: number
} | null

type TreasuryTransaction = {
  id: string
} | null

type MirrorJob = {
  status: string
} | null

type Initiator = {
  email: string | null
  trustScore: number | null
  tier: string | null
} | null

type ApprovalIntelligence = {
  riskScore: number
  flags: string[]
  avgHistoricalAmount: number
  currentAmount: number
} | null

export default function ActionDetailPanel({
  action,
  queue,
  transaction,
  mirror,
  initiator,
  intelligence,
}: {
  action: TreasuryAction
  queue: ExecutionQueue
  transaction: TreasuryTransaction
  mirror: MirrorJob
  initiator: Initiator
  intelligence: ApprovalIntelligence
}) {
  const [loading, setLoading] = useState(false)

  async function approve() {
    setLoading(true)
    await fetch(`/api/treasury/actions/${action.id}/approve`, {
      method: 'POST',
    })
    location.reload()
  }

  async function reject() {
    setLoading(true)
    await fetch(`/api/treasury/actions/${action.id}/reject`, {
      method: 'POST',
    })
    location.reload()
  }

  const amount = Number(action.amountBaseUnits.toString()) / 1_000_000

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-xl bg-neutral-950">
        <div className="text-xs opacity-60">Action ID</div>
        <div className="font-mono text-sm">{action.id}</div>

        <div className="mt-3 text-lg font-semibold">
          {amount} {action.assetCode}
        </div>

        <div className="text-sm opacity-70">{action.intent}</div>
      </div>

      <div className="p-4 border rounded-xl bg-neutral-950">
        <h2 className="text-sm font-semibold mb-2">Participants</h2>

        <div className="text-sm">Initiator: {initiator?.email ?? 'N/A'}</div>

        <div className="text-sm opacity-60">
          Trust Score: {initiator?.trustScore ?? 'N/A'}
        </div>

        <div className="text-sm opacity-60">
          Tier: {initiator?.tier ?? 'N/A'}
        </div>
      </div>

      <div className="p-4 border rounded-xl bg-neutral-950">
        <h2 className="text-sm font-semibold mb-2">Approvals</h2>

        <div className="space-y-2">
          {action.approvals.map((approval) => (
            <div key={approval.id} className="text-sm">
              {approval.approverUserId} → {approval.decision}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border rounded-xl bg-neutral-950">
        <h2 className="text-sm font-semibold mb-2">Execution Trace</h2>

        <div className="mb-2">
          <div className="text-xs opacity-60">Queue</div>
          {queue ? (
            <div className="text-sm">
              Status: {queue.status} | Retries: {queue.retryCount}
            </div>
          ) : (
            <div className="text-sm opacity-60">Not queued</div>
          )}
        </div>

        <div className="mb-2">
          <div className="text-xs opacity-60">Transaction</div>
          {transaction ? (
            <div className="text-sm font-mono">{transaction.id}</div>
          ) : (
            <div className="text-sm opacity-60">Not executed</div>
          )}
        </div>

        <div>
          <div className="text-xs opacity-60">On-chain Mirror</div>
          {mirror ? (
            <div className="text-sm">Status: {mirror.status}</div>
          ) : (
            <div className="text-sm opacity-60">
              Not mirrored / not applicable
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border rounded-xl bg-neutral-950">
        <h2 className="text-sm font-semibold mb-2">Risk</h2>

        <div className="text-sm">
          {amount > 500
            ? 'HIGH VALUE'
            : amount > 50
            ? 'MEDIUM VALUE'
            : 'LOW VALUE'}
        </div>
      </div>

      <div className="p-4 border rounded-xl bg-neutral-950">
        <h2 className="text-sm font-semibold mb-2">Intelligence</h2>

        {intelligence ? (
          <>
            <div className="text-sm">
              Risk Score: {intelligence.riskScore}
            </div>

            <div className="text-sm">
              Avg Historical: {intelligence.avgHistoricalAmount}
            </div>

            <div className="text-sm">
              Current: {intelligence.currentAmount}
            </div>

            <div className="mt-2 flex gap-2 flex-wrap">
              {intelligence.flags.map((flag) => (
                <span
                  key={flag}
                  className="text-xs px-2 py-1 bg-yellow-700 rounded"
                >
                  {flag}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm opacity-60">
            No intelligence available
          </div>
        )}
      </div>

      {action.status === 'PENDING' && (
        <div className="flex gap-4">
          <button
            onClick={approve}
            disabled={loading}
            className="px-4 py-2 bg-green-600 rounded"
          >
            Approve
          </button>

          <button
            onClick={reject}
            disabled={loading}
            className="px-4 py-2 bg-red-600 rounded"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
