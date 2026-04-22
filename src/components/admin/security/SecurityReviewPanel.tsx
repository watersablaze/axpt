type UserSecurityRow = {
  id: string
  email: string
  frozen: boolean
  quarantine: boolean
  trustScore?: number
}

type Props = {
  users: UserSecurityRow[]
}

export default function SecurityReviewPanel({ users }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg font-semibold">
        Security Review
      </h2>

      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="p-3 border rounded-lg flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{u.email}</div>

              <div className="text-xs opacity-60">
                Trust: {u.trustScore ?? '—'}
              </div>

              <div className="text-xs">
                {u.frozen && (
                  <span className="text-red-400 mr-2">FROZEN</span>
                )}
                {u.quarantine && (
                  <span className="text-yellow-400">QUARANTINED</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  fetch('/api/admin/security/appeals/review', {
                    method: 'POST',
                    body: JSON.stringify({
                      userId: u.id,
                      decision: 'APPROVE',
                      reason: 'Manual unfreeze',
                    }),
                  })
                }
                className="px-3 py-1 bg-green-600 rounded text-sm"
              >
                Unfreeze
              </button>

              <button
                onClick={() =>
                  fetch('/api/admin/security/appeals/review', {
                    method: 'POST',
                    body: JSON.stringify({
                      userId: u.id,
                      decision: 'REJECT',
                      reason: 'Maintain restriction',
                    }),
                  })
                }
                className="px-3 py-1 bg-red-600 rounded text-sm"
              >
                Keep Locked
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}