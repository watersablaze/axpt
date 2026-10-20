import Link from "next/link";
import { Suspense } from "react";
import IncomingWorkOverview from "@/components/admin/incoming/IncomingWorkOverview";

export const dynamic = "force-dynamic";

const groups = [
  {
    title: "Daily operations",
    description: "Receive, review, communicate, and coordinate.",
    links: [
      ["/admin/incoming", "Incoming work", "Access requests, submitted LOIs, inquiries, and representative field activity."],
      ["/admin/control-center", "Control Center", "Operational signals, decision work, and execution oversight."],
      ["/admin/communications", "Communications", "Institutional conversations and replies."],
    ],
  },
  {
    title: "Financial operations",
    description: "Review commercial submissions and financial records.",
    links: [
      ["/admin/transaction-intakes", "Transaction intakes", "Review submitted commercial records and their current status."],
      ["/admin/treasury", "Treasury", "Financial intake, cases, reconciliation, and settlement operations."],
    ],
  },
  {
    title: "Institutional administration",
    description: "Manage access, representatives, and institutional work.",
    links: [
      ["/admin/institutional-access", "Institutional access", "Review Profile and LOI access requests and manage grants."],
      ["/admin/representative-program", "Representative Program", "Candidate intake, agreements, appointments, and participant workspaces."],
      ["/admin/initiatives", "Initiatives", "Review and maintain initiative records."],
    ],
  },
  {
    title: "System oversight",
    description: "Inspect delivery outcomes, security, and configuration.",
    links: [
      ["/admin/incoming/alerts", "Alert delivery", "Inspect recorded Admin notification outcomes and guarded retries."],
      ["/admin/security", "Security", "Open the existing security console."],
      ["/admin/settings", "Settings", "Open operational configuration."],
    ],
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-10 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-neutral-800 pb-6">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[.2em] text-amber-200/80">
            Administration · Operations overview
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-white">
            Your operating desk
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Check what needs attention, then enter the workspace where the work happens.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/incoming" className="rounded-lg bg-amber-100 px-4 py-3 text-sm font-medium text-neutral-950 hover:bg-white">
            Review incoming work →
          </Link>
          <Link href="/admin/control-center" className="rounded-lg border border-neutral-700 px-4 py-3 text-sm text-neutral-200 hover:border-neutral-400">
            Control Center →
          </Link>
        </div>
      </header>

      <Suspense fallback={
        <p role="status" className="text-sm text-neutral-400">
          Checking incoming work…
        </p>
      }>
        <IncomingWorkOverview />
      </Suspense>

      <section aria-labelledby="workspace-directory">
        <div className="mb-6">
          <h2 id="workspace-directory" className="text-xl font-medium text-white">
            Operational workspaces
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Each workspace retains its own review and action controls.
          </p>
        </div>
        <div className="grid gap-x-10 gap-y-8 xl:grid-cols-2">
          {groups.map(group => (
            <section key={group.title} aria-label={group.title} className="min-w-0">
              <h3 className="text-xs font-medium uppercase tracking-[.15em] text-neutral-300">
                {group.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-neutral-500">{group.description}</p>
              <ul className="mt-4 divide-y divide-neutral-800 border-y border-neutral-800">
                {group.links.map(([href, title, description]) => (
                  <li key={href}>
                    <Link href={href} className="group flex items-start justify-between gap-4 px-2 py-4 transition-colors hover:bg-white/[.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-100 group-hover:text-amber-100">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
                      </div>
                      <span aria-hidden="true" className="text-neutral-600 group-hover:text-amber-100">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
