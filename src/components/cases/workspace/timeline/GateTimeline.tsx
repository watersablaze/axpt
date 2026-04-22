import React from "react"

type Gate = {
  id: string
  name: string
  status: "PENDING" | "VERIFIED" | "REJECTED"
  ord: number
}

type Props = {
  gates: Gate[]
  onSelectGate: (gate: Gate) => void
}

export default function GateTimeline({ gates, onSelectGate }: Props) {

  const sorted = [...gates].sort((a,b)=>a.ord-b.ord)

  return (
    <div className="gateTimeline">

      {sorted.map((gate, index) => {

        const statusIcon =
          gate.status === "VERIFIED"
            ? "✓"
            : gate.status === "REJECTED"
            ? "✕"
            : "○"

        return (
          <div
            key={gate.id}
            className="gateRow"
            onClick={() => onSelectGate(gate)}
          >

            <div className="gateIcon">
              {statusIcon}
            </div>

            <div className="gateContent">
              <div className="gateTitle">
                {gate.name}
              </div>

              <div className="gateMeta">
                Step {gate.ord}
              </div>
            </div>

          </div>
        )
      })}

    </div>
  )
}