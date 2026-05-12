"use client"

import { useEffect, useState } from "react"

type Trace = {
  id: string
  type: string
  timestamp: number
  payload?: any
  result?: any
}

export default function ExecutionReplayConsole() {

  const [logs, setLogs] = useState<Trace[]>([])
  const [selected, setSelected] = useState<Trace | null>(null)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    fetch(`/api/admin/replay?filter=${filter}`)
      .then(res => res.json())
      .then(setLogs)
  }, [filter])

  return (
    <div className="grid grid-cols-3 gap-4 h-full">

      {/* LEFT: TIMELINE */}
      <div className="col-span-1 border-r border-emerald-500/20 p-2 overflow-y-auto">

        <h2 className="text-emerald-300 font-semibold mb-2">
          Execution Timeline
        </h2>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-3 bg-black text-slate-300 border border-slate-700 p-1"
        >
          <option>ALL</option>
          <option>ESCROW</option>
          <option>GOVERNANCE</option>
          <option>SNAPSHOT</option>
          <option>BLOCKED</option>
          <option>BROADCAST</option>
        </select>

        {logs.map(log => (
          <div
            key={log.id}
            onClick={() => setSelected(log)}
            className="p-2 mb-2 bg-black/40 border border-slate-800 cursor-pointer hover:border-emerald-400"
          >
            <div className="text-xs text-emerald-300">
              {log.type}
            </div>
            <div className="text-[10px] text-slate-500">
              {new Date(log.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

      </div>

      {/* CENTER: DETAIL VIEW */}
      <div className="col-span-1 p-4">

        <h2 className="text-slate-200 font-semibold mb-2">
          Node Inspector
        </h2>

        {selected ? (
          <pre className="text-xs text-slate-300 bg-black/50 p-3 rounded overflow-auto">
            {JSON.stringify(selected, null, 2)}
          </pre>
        ) : (
          <div className="text-slate-500 text-sm">
            Select a trace node
          </div>
        )}

      </div>

      {/* RIGHT: CAUSAL VIEW */}
      <div className="col-span-1 p-4 border-l border-emerald-500/20">

        <h2 className="text-slate-200 font-semibold mb-2">
          Causal Chain
        </h2>

        {selected ? (
          <CausalChain nodeId={selected.id} />
        ) : (
          <div className="text-slate-500 text-sm">
            No node selected
          </div>
        )}

      </div>

    </div>
  )
}

function CausalChain({ nodeId }: { nodeId: string }) {

  const [chain, setChain] = useState<string[]>([])

  useEffect(() => {
    fetch(`/api/admin/replay?timestamp=0`)
      .then(res => res.json())
      .then(() => {
        // placeholder: real DAG endpoint comes next
        setChain([nodeId])
      })
  }, [nodeId])

  return (
    <div className="text-xs text-emerald-300 space-y-1">
      {chain.map(id => (
        <div key={id}>
          → {id}
        </div>
      ))}
    </div>
  )
}