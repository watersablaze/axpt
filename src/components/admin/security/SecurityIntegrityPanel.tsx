type IntegrityRow = {
  id: string
  email: string | null
  frozen: boolean
  quarantine: boolean
  hasRiskScore: boolean
  hasTrustScore: boolean
  hasClusterId: boolean
}

type Props = {
  users: IntegrityRow[]
}

export default function SecurityIntegrityPanel({ users }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Security Integrity
      </h2>

      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-lg border border-neutral-800 bg-black/30 p-3"
          >
            <div className="font-medium text-white">
              {u.email ?? u.id}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-300 md:grid-cols-5">
              <div>
                <span className="text-neutral-500">Frozen:</span>{' '}
                <span className={u.frozen ? 'text-red-400' : 'text-green-400'}>
                  {u.frozen ? 'Yes' : 'No'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500">Quarantine:</span>{' '}
                <span
                  className={u.quarantine ? 'text-amber-400' : 'text-green-400'}
                >
                  {u.quarantine ? 'Yes' : 'No'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500">Risk:</span>{' '}
                <span
                  className={
                    u.hasRiskScore ? 'text-cyan-300' : 'text-neutral-500'
                  }
                >
                  {u.hasRiskScore ? 'Present' : 'Missing'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500">Trust:</span>{' '}
                <span
                  className={
                    u.hasTrustScore ? 'text-cyan-300' : 'text-neutral-500'
                  }
                >
                  {u.hasTrustScore ? 'Present' : 'Missing'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500">Cluster:</span>{' '}
                <span
                  className={
                    u.hasClusterId ? 'text-violet-300' : 'text-neutral-500'
                  }
                >
                  {u.hasClusterId ? 'Present' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}