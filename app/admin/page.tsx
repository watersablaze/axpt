import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">
          AXPT Admin
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Entry points for command, treasury, initiatives, and system configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/admin/command-center"
          className="rounded-xl border border-neutral-800 bg-black/50 p-5 transition-colors hover:border-cyan-500/60"
        >
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Command
          </div>
          <div className="mt-2 text-lg font-medium text-white">
            Command Center
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            Live field, decision core, event stream, and operational signals.
          </div>
        </Link>

        <Link
          href="/admin/treasury"
          className="rounded-xl border border-neutral-800 bg-black/50 p-5 transition-colors hover:border-cyan-500/60"
        >
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Treasury
          </div>
          <div className="mt-2 text-lg font-medium text-white">
            Treasury Console
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            Intake, cases, escrow, artifacts, ledger, and reconciliation.
          </div>
        </Link>

        <Link
          href="/admin/initiatives"
          className="rounded-xl border border-neutral-800 bg-black/50 p-5 transition-colors hover:border-cyan-500/60"
        >
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Initiatives
          </div>
          <div className="mt-2 text-lg font-medium text-white">
            Initiative Management
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            Review, update, and create initiative records.
          </div>
        </Link>

        <Link
          href="/admin/security"
          className="rounded-xl border border-neutral-800 bg-black/50 p-5 transition-colors hover:border-cyan-500/60"
        >
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Security
          </div>
          <div className="mt-2 text-lg font-medium text-white">
            Security Console
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            Risk, trust, freezes, appeals, and behavioral intelligence.
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="rounded-xl border border-neutral-800 bg-black/50 p-5 transition-colors hover:border-cyan-500/60"
        >
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Settings
          </div>
          <div className="mt-2 text-lg font-medium text-white">
            Council Settings
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            Configure operational settings and notification targets.
          </div>
        </Link>
      </div>
    </div>
  )
}
