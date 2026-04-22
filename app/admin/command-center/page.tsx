import CommandCenterView from "@/components/admin/command-center/CommandCenterView"
import Link from "next/link"

export default function CommandCenterPage() {
  return (
    <div className="space-y-12">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            AXPT Command Center
          </h1>
          <p className="text-sm text-neutral-500">
            Real-time decision system
          </p>
        </div>

        <Link
          href="/admin/cases/new"
          className="bg-emerald-600 px-4 py-2 rounded text-sm font-medium"
        >
          + Initiate Case
        </Link>
      </div>

      <CommandCenterView />

    </div>
  )
}