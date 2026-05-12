"use client"

import CognitiveTelemetryPanel from "@/components/admin/treasury/CognitiveTelemetryPanel"
import ExecutionQueuePanel from "@/components/admin/treasury/ExecutionQueuePanel"
import ChainActivityPanel from "@/components/admin/treasury/ChainActivityPanel"
import ReconciliationDriftPanel from "@/components/admin/treasury/ReconciliationDriftPanel"

export default function TreasuryCommandCenter() {
  return (
    <div className="p-6 space-y-6 text-white bg-black">

      <h1 className="text-2xl font-semibold">
        AXPT Treasury Command Center
      </h1>

      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-4 space-y-4">
          <CognitiveTelemetryPanel />
          <ReconciliationDriftPanel />
        </div>

        <div className="col-span-4">
          <ExecutionQueuePanel />
        </div>

        <div className="col-span-4">
          <ChainActivityPanel />
        </div>

      </div>

    </div>
  )
}