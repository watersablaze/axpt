'use client'

type ApprovalGrant = {
  id?: string
  operatorEmail: string
  decision: string
  roleKey?: string
  note?: string | null
  createdAt: string
}

type ApprovalRequirement = {
  id?: string
  transitionKey: string
  requiredRole: string
  requiredCount: number
  status: string
  approvals: ApprovalGrant[]
}

type Props = {
  dossierId: string
  requirements?: ApprovalRequirement[]
  onRefresh?: () => Promise<void>
}

function statusTone(status: string) {
  switch (status) {
    case 'SATISFIED':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'REJECTED':
    case 'BLOCKED':
      return 'border-red-900 bg-red-950/20 text-red-300'

    case 'PENDING':
      return 'border-orange-900 bg-orange-950/20 text-orange-300'

    default:
      return 'border-neutral-800 bg-black/30 text-neutral-400'
  }
}

function decisionTone(decision: string) {
  switch (decision) {
    case 'APPROVED':
      return 'text-emerald-300'

    case 'REJECTED':
      return 'text-red-300'

    default:
      return 'text-neutral-400'
  }
}

function formatTime(value?: string) {
  if (!value) return '—'

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function approveRequirement({
  dossierId,
  requirement,
  onRefresh,
}: {
  dossierId: string
  requirement: ApprovalRequirement
  onRefresh?: () => Promise<void>
}) {
  try {
    const response = await fetch(
      `/api/admin/control-center/dossiers/${dossierId}/approvals`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transitionKey: requirement.transitionKey,
          requiredRole: requirement.requiredRole,
          note: `Approved from Control Center: ${requirement.transitionKey}.`,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error(
        '[DOSSIER_APPROVAL_FAILED]',
        result
      )

      window.alert(
        result.detail ??
          result.error ??
          'Approval failed.'
      )

      return
    }

    await onRefresh?.()
  } catch (err) {
    console.error(
      '[DOSSIER_APPROVAL_REQUEST_FAILED]',
      err
    )

    window.alert('Approval request failed.')
  }
}

export default function DossierApprovalPanel({
  dossierId,
  requirements = [],
  onRefresh,
}: Props) {
  const pendingCount =
    requirements.filter(
      (requirement) =>
        requirement.status !== 'SATISFIED'
    ).length

  return (
    <div className="rounded-lg border border-neutral-800 bg-black/20 p-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Approval Gates
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            Institutional Authorization
          </div>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {pendingCount} Pending
        </div>
      </div>

      {requirements.length === 0 ? (
        <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-2 text-neutral-500">
          No approval requirements recorded.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {requirements.map((requirement) => {
            const approvedCount =
              requirement.approvals.filter(
                (approval) =>
                  approval.decision === 'APPROVED'
              ).length

            const canApprove =
              requirement.status !== 'SATISFIED'

            return (
              <div
                key={
                  requirement.id ??
                  requirement.transitionKey
                }
                className={`rounded border p-2 ${statusTone(
                  requirement.status
                )}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">
                      {requirement.transitionKey}
                    </div>

                    <div className="mt-1 text-[11px] text-neutral-400">
                      Requires{' '}
                      {requirement.requiredCount}{' '}
                      approval(s) from{' '}
                      {requirement.requiredRole}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide opacity-70">
                      {requirement.status}
                    </div>

                    <div className="mt-1 text-[11px] text-neutral-400">
                      {approvedCount}/
                      {requirement.requiredCount}
                    </div>
                  </div>
                </div>

                {requirement.approvals.length > 0 ? (
                  <div className="mt-2 space-y-1 border-t border-neutral-800 pt-2">
                    {requirement.approvals.map(
                      (approval) => (
                        <div
                          key={
                            approval.id ??
                            `${approval.operatorEmail}-${approval.createdAt}`
                          }
                          className="rounded bg-black/20 px-2 py-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-neutral-300">
                              {approval.operatorEmail}
                            </span>

                            <span
                              className={`text-[10px] uppercase tracking-wide ${decisionTone(
                                approval.decision
                              )}`}
                            >
                              {approval.decision}
                            </span>
                          </div>

                          <div className="mt-1 text-[10px] text-neutral-500">
                            {approval.roleKey ??
                              requirement.requiredRole}
                            {' · '}
                            {formatTime(approval.createdAt)}
                          </div>

                          {approval.note ? (
                            <div className="mt-1 text-[11px] text-neutral-400">
                              {approval.note}
                            </div>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                ) : null}

                {canApprove ? (
                  <div className="mt-2 border-t border-neutral-800 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        approveRequirement({
                          dossierId,
                          requirement,
                          onRefresh,
                        })
                      }
                      className="rounded border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300 hover:border-emerald-600"
                    >
                      Approve
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}