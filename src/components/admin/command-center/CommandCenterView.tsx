"use client"

import DecisionSurface from "./DecisionSurface"
import GlobalAwarenessPanel from "@/components/admin/GlobalAwarenessPanel"
import GlobalPulsePanel from "./GlobalPulsePanel"
import EventStreamPanel from "@/components/admin/panels/EventStreamPanel"
import NotificationCenter from "@/components/admin/NotificationCenter"
import CaseHeatmap from "@/components/admin/CaseHeatmap"
import SystemFieldPanel from "@/components/admin/system/SystemFieldPanel"

export default function CommandCenterView() {
  return (
    <div className="space-y-8">
      <GlobalAwarenessPanel variant="strip" />

      <div className="rounded-2xl border border-neutral-800 bg-black/80 p-4">
        <SystemFieldPanel />
      </div>

      <div className="space-y-6 border-t border-neutral-900 pt-6">
        <div className="mx-auto max-w-5xl">
          <DecisionSurface />
        </div>
      </div>

      <div className="space-y-6 border-t border-neutral-900 pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <GlobalPulsePanel />
          </div>

          <div className="lg:col-span-7">
            <EventStreamPanel />
          </div>
        </div>
      </div>

      <div className="space-y-6 border-t border-neutral-900 pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <NotificationCenter />
          </div>

          <div className="lg:col-span-6">
            <CaseHeatmap />
          </div>
        </div>
      </div>
    </div>
  )
}
