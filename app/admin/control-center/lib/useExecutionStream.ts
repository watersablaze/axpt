// app/admin/control-center/lib/useExecutionStream.ts

import { useEffect, useState } from "react"

export function useExecutionStream() {
  const [snapshot, setSnapshot] = useState(null)

  useEffect(() => {
    const ws = new EventSource("/api/admin/execution-stream")

    ws.onmessage = (e) => {
      setSnapshot(JSON.parse(e.data))
    }

    return () => ws.close()
  }, [])

  return snapshot
}