type Props = {
  type: string
  timestamp: string
  payload?: any
}

export default function EventItem({ type, timestamp, payload }: Props) {

  const label = getEventLabel(type)

  return (
    <div className="border-l-2 border-neutral-700 pl-4 py-2">

      <div className="text-xs text-neutral-500">
        {new Date(timestamp).toLocaleString()}
      </div>

      <div className="text-sm font-medium">
        {label}
      </div>

      {payload?.amount && (
        <div className="text-xs text-neutral-400 mt-1">
          Amount: {payload.amount}
        </div>
      )}

      {payload?.txHash && (
        <div className="text-xs text-neutral-500">
          TX: {payload.txHash.slice(0, 10)}...
        </div>
      )}

    </div>
  )
}

function getEventLabel(type: string) {
  switch (type) {
    case "CASE_CREATED":
      return "Case created"

    case "ESCROW_FUNDED":
      return "Escrow funded"

    case "ESCROW_PARTIALLY_FUNDED":
      return "Partial escrow funding"

    case "ESCROW_MISMATCH":
      return "Escrow mismatch detected"

    case "ESCROW_LOCKED":
      return "Escrow locked"

    case "ESCROW_RELEASED":
      return "Escrow released"

    case "CASE_FLAGGED":
      return "Case flagged for review"

    case "ACTION_REVERSED":
      return "Operator action reversed"

    default:
      return type
  }
}