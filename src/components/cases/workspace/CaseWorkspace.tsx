"use client"

import { useState } from "react"

import CaseHeader from "./CaseHeader"
import GateTimeline from "./timeline/GateTimeline"
import GateVerifyPanel from "./timeline/GateVerifyPanel"

import { CaseData, CaseGate } from "@/shared/types/case"

type Props = {
  caseData: CaseData
  gates: CaseGate[]
}

export default function CaseWorkspace({ caseData, gates }: Props) {

  const [selectedGate, setSelectedGate] = useState<CaseGate | null>(null)

  function handleVerify() {
    if (!selectedGate) return
    console.log("verify gate", selectedGate.id)
  }

  function handleReject() {
    if (!selectedGate) return
    console.log("reject gate", selectedGate.id)
  }

  return (
    <div className="caseWorkspace">

      <CaseHeader caseData={caseData} />

      <div className="workspaceBody">

        <div className="timelineColumn">

          <GateTimeline
            gates={gates}
            onSelectGate={setSelectedGate}
          />

        </div>

        <div className="verifyColumn">

          {selectedGate && (

            <GateVerifyPanel
              gateId={selectedGate.id}
              onVerify={handleVerify}
              onReject={handleReject}
            />

          )}

        </div>

      </div>

    </div>
  )
}