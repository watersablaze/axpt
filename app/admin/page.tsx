import Link from "next/link";
import { Suspense } from "react";
import styles from "@/components/admin/layout/AdminDeskColumns.module.css";
import AdminSurfaceHeader from "@/components/admin/layout/AdminSurfaceHeader";
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
    <div className="w-full min-w-0 space-y-6 pb-4">
      <AdminSurfaceHeader
        title="Operations overview"
        description="Review attention signals and enter your workspace."
        actions={
          <>
            <Link href="/admin/incoming">
              Incoming work <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/admin/control-center">
              Control Center <span aria-hidden="true">↗</span>
            </Link>
          </>
        }
      />

      <div className={styles.columns}>
        <aside aria-label="Current position" className={styles.sidebar}>
      <Suspense fallback={
        <p role="status" className="text-sm text-neutral-400">
          Checking incoming work…
        </p>
      }>
        <IncomingWorkOverview />
      </Suspense>
        </aside>


      <section aria-labelledby="workspace-directory" className={styles.main}>
        <div className="mb-4">
          <h2 id="workspace-directory" className="text-xl font-medium text-white">
            Operational workspaces
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Each workspace retains its own review and action controls.
          </p>
        </div>
        <div className="grid gap-x-8 gap-y-5 xl:grid-cols-2">
          {groups.map(group => (
            <section key={group.title} aria-label={group.title} className="min-w-0">
              <h3 className="text-xs font-medium uppercase tracking-[.15em] text-neutral-300">
                {group.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-neutral-500">{group.description}</p>
              <ul className="mt-3 divide-y divide-neutral-800 border-y border-neutral-800">
                {group.links.map(([href, title, description]) => (
                  <li key={href}>
                    <Link href={href} className="group flex items-start justify-between gap-4 px-2 py-3 transition-colors hover:bg-white/[.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
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
    </div>
  );
}
