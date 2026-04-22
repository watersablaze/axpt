"use client"

import { useEffect, useState } from "react"

export default function EscrowLedgerPage() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/admin/escrow-ledger")
      .then(r => r.json())
      .then(setData)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Escrow Ledger</h1>

      {data.map((caseItem) => (
        <div key={caseItem.caseId} className="border border-neutral-800 p-4 rounded">

          <div className="font-semibold mb-2">
            Case: {caseItem.caseId}
          </div>

          <div className="space-y-2">
            {caseItem.events.map((e: any, i: number) => (
              <div key={i} className="text-sm border-b border-neutral-800 pb-1">
                <div>{e.type}</div>
                <div className="text-neutral-400">
                  {e.amount} USDT
                </div>
              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  )
}