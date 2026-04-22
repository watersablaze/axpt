type GateStatus = "PENDING" | "VERIFIED" | "REJECTED"

type Gate = {
  id: string
  name: string
  ord: number
  status: GateStatus
  gateType?: string
}

type Props = {
  gate: Gate
}

export default function CaseGateCard({ gate }: Props) {

  const statusIcon: Record<string,string> = {
    VERIFIED: "✓",
    REJECTED: "✕",
    PENDING: "○"
  }

  return (
    <div className="caseGateCard">

      <div className="gateIcon">
        {statusIcon[gate.status]}
      </div>

      <div className="gateInfo">
        <div className="gateName">
          {gate.name}
        </div>

        <div className="gateMeta">
          Step {gate.ord}
        </div>
      </div>

    </div>
  )
}