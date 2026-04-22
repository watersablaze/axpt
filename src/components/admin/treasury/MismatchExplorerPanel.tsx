type Mismatch = {
  type: string
  assetCode?: string | null
  walletEventId?: string | null
  idempotencyKey?: string | null
  detail?: Record<string, unknown>
}

type Props = {
  mismatches: Mismatch[]
}

export default function MismatchExplorerPanel({ mismatches }: Props) {
  if (!mismatches.length) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <h2 className="text-lg">Mismatch Explorer</h2>
        <div className="text-sm text-green-400 mt-2">
          No mismatches detected
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-red-900 bg-black p-4">
      <h2 className="text-lg text-red-400 mb-4">
        Mismatch Explorer ({mismatches.length})
      </h2>

      <div className="space-y-3 max-h-[400px] overflow-auto">
        {mismatches.map((m, i) => (
          <div
            key={i}
            className="border border-neutral-800 rounded-lg p-3 text-sm"
          >
            <div className="text-red-400 font-medium">{m.type}</div>

            {m.assetCode && (
              <div>Asset: {m.assetCode}</div>
            )}

            {m.walletEventId && (
              <div>WalletEvent: {m.walletEventId}</div>
            )}

            {m.idempotencyKey && (
              <div className="truncate">
                Idempotency: {m.idempotencyKey}
              </div>
            )}

            {m.detail && (
              <pre className="mt-2 text-xs text-neutral-400 overflow-auto">
                {JSON.stringify(m.detail, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}