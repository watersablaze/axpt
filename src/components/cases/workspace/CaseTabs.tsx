"use client"

import { useState } from "react"

import CaseOverviewTab from "./tabs/CaseOverviewTab"
import CaseGatesTab from "./tabs/CaseGatesTab"
import CaseArtifactsTab from "./tabs/CaseArtifactsTab"
import CasePartiesTab from "./tabs/CasePartiesTab"
import CaseEscrowTab from "./tabs/CaseEscrowTab"
import CaseEventsTab from "./tabs/CaseEventsTab"

type Props = {
  caseId: string
}

export default function CaseTabs({ caseId }: Props) {

  const [tab, setTab] = useState("overview")

  return (
    <div className="space-y-6">

      <div className="flex gap-4 border-b border-neutral-800 pb-2">

        <button onClick={()=>setTab("overview")}>Overview</button>
        <button onClick={()=>setTab("gates")}>Gates</button>
        <button onClick={()=>setTab("artifacts")}>Artifacts</button>
        <button onClick={()=>setTab("parties")}>Parties</button>
        <button onClick={()=>setTab("escrow")}>Escrow</button>
        <button onClick={()=>setTab("events")}>Events</button>

      </div>

      {tab==="overview" && <CaseOverviewTab caseId={caseId} />}
      {tab==="gates" && <CaseGatesTab caseId={caseId} />}
      {tab==="artifacts" && <CaseArtifactsTab caseId={caseId} />}
      {tab==="parties" && <CasePartiesTab caseId={caseId} />}
      {tab==="escrow" && <CaseEscrowTab caseId={caseId} />}
      {tab==="events" && <CaseEventsTab caseId={caseId} />}

    </div>
  )
}