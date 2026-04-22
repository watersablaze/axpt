"use client"

import { useEffect, useState } from "react"

export default function EscrowRiskMonitor() {

  const [rows, setRows] = useState<any[]>([])

  useEffect(()=>{

    fetch("/api/admin/escrow-risk")
      .then(r=>r.json())
      .then(setRows)

  },[])

  return (

    <div className="escrowMonitor">

      <h2>Escrow Risk Monitor</h2>

      {rows.map(row=>(
        <div key={row.id} className="escrowRow">

          <div>{row.caseTitle}</div>

          <div>{row.ageHours.toFixed(1)}h</div>

          <div className={`risk ${row.risk}`}>
            {row.risk}
          </div>

        </div>
      ))}

    </div>

  )

}