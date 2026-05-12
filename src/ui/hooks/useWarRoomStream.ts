"use client"

import { useEffect, useState } from "react"

export function useWarRoomStream() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const ws = new WebSocket("/api/warroom/stream")

    ws.onmessage = (msg) => {
      setEvents((prev) => [...prev, JSON.parse(msg.data)])
    }

    return () => ws.close()
  }, [])

  return events
}