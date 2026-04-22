"use client"

import { useEffect, useState } from "react"

export default function GateQueuePanel() {

  const [gates, setGates] = useState<any[]>([])

  useEffect(()=>{

    fetch("/api/admin/gate-queue")
      .then(r=>r.json())
      .then(setGates)

  },[])

  return (

    <div className="gateQueuePanel">

      <h2>Gate Queue</h2>

      {gates.map(gate=>(
        <div key={gate.id} className="gateRow">

          <div>{gate.case.title}</div>
          <div>{gate.name}</div>
          <div>{gate.status}</div>

        </div>
      ))}

    </div>

  )

}