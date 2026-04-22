import GateTimeline from "../timeline/GateTimeline"
import { CaseGate } from "@/shared/types/case"

type Props = {
  caseId: string
}

export default function CaseGatesTab({ caseId }: Props) {

  const gates: CaseGate[] = []

  return (
    <div className="space-y-4">

      <h2 className="text-xl font-semibold">
        Gate Timeline
      </h2>

      <GateTimeline
        gates={gates}
        onSelectGate={(gate) => {
          console.log("Selected gate:", gate)
        }}
      />

    </div>
  )
}