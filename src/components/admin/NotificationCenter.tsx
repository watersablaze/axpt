"use client"

import { useEffect, useState } from "react"
import PanelWrapper from "@/components/admin/system/PanelWrapper"
import { useAwareness } from "@/lib/realtime/AwarenessProvider"

type Notification = {
  id: string
  message: string
  type: "INFO" | "WARNING" | "CRITICAL"
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null)
  const { global, isStale } = useAwareness()

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then(setNotifications)
      .catch(() => setNotifications([]))
  }, [])

  if (notifications === null) {
    return (
      <PanelWrapper title="Notifications" isEmpty>
        <div className="text-xs text-neutral-500">Loading notifications...</div>
      </PanelWrapper>
    )
  }

  if (notifications.length === 0) {
    return (
      <PanelWrapper title="Notifications" isEmpty>
        <div className="text-xs text-neutral-500">No active notifications.</div>
      </PanelWrapper>
    )
  }

  const tone =
    global.escalation.level === "CRITICAL"
      ? "border-red-500/30"
      : global.escalation.level === "DEGRADED"
      ? "border-yellow-500/30"
      : "border-neutral-800"

  return (
    <PanelWrapper title="Notifications">
      <div className={`rounded-lg border ${tone} bg-black/30 p-3 space-y-3`}>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-neutral-500">
          <span>Notification Feed</span>
          <span>{isStale ? "stale context" : global.dominantMode}</span>
        </div>

        <div className="space-y-2">
          {notifications.map((n) => {
            const color =
              n.type === "CRITICAL"
                ? "text-red-400 border-red-500/40"
                : n.type === "WARNING"
                ? "text-yellow-400 border-yellow-500/40"
                : "text-blue-400 border-blue-500/40"

            return (
              <div
                key={n.id}
                className={`text-xs border rounded px-3 py-2 ${color}`}
              >
                {n.message}
              </div>
            )
          })}
        </div>
      </div>
    </PanelWrapper>
  )
}