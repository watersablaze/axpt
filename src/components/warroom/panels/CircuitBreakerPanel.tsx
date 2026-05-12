"use client"

import { useEffect, useState } from "react"
import { circuitBreakerEngine } from "@/engines/governance/AXPTCircuitBreakerEngine"

export default function CircuitBreakerPanel() {
  const [mode, setMode] = useState("NORMAL")

  useEffect(() => {
    const i = setInterval(() => {
      setMode(circuitBreakerEngine.getMode())
    }, 300)

    return () => clearInterval(i)
  }, [])

  return (
    <div className="p-4 border border-amber-500/20 rounded-xl bg-black/60">
      <div className="text-xs text-slate-400">CIRCUIT BREAKER</div>

      <div className="mt-2 text-xl text-amber-300">
        {mode}
      </div>
    </div>
  )
}