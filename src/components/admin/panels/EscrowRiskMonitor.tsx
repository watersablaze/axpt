"use client"

import { useEffect, useState } from "react"

type EscrowRisk = {
  caseId: string
  risk: string
}

export default function EscrowRiskMonitor() {

  const [risks, setRisks] = useState<EscrowRisk[]>([])

  useEffect(() => {

    fetch("/api/admin/escrow-risk")
      .then(r => r.json())
      .then(setRisks)

  }, [])

  return (

    <div className="border border-neutral-800 rounded-lg p-4">

      <h2 className="text-lg font-semibold mb-3">
        Escrow Risk Monitor
      </h2>

      <div className="space-y-2 text-sm">

        {risks.map(r => (

          <div key={r.caseId}>

            Case {r.caseId} — {r.risk}

          </div>

        ))}

      </div>

    </div>
  )
}