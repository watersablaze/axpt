import Link from "next/link";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { loadAdminAttention } from "@/domains/admin-incoming/loadAdminAttention";

export default async function IncomingWorkOverview() {
  const principal = await getPrincipal();
  if (!principal || !isAdmin(principal)) return null;
  const { readings } = await loadAdminAttention(prisma, principal);

  return (
    <section aria-labelledby="incoming-overview" className="space-y-4">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[.16em] text-neutral-500">Current position</p>
        <h2 id="incoming-overview" className="text-lg font-medium text-cyan-100">Attention</h2>
        <p className="text-xs leading-5 text-neutral-400">Checked when this page loads.</p>
        <Link href="/admin/incoming" className="inline-block text-xs text-cyan-200 hover:text-white">
          Incoming work ↗
        </Link>
      </header>

      <div className="grid grid-cols-1">
        {readings.map(check => {
          const reading = check.reading;

          return (
            <Link
              key={check.title}
              href={check.href}
              className="border-b border-neutral-800 py-3 transition-colors hover:border-cyan-400/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              <h3 className="text-xs font-medium text-neutral-200">{check.title}</h3>
              <p className={`mt-1 text-xl tabular-nums ${reading ? "text-amber-100" : "text-amber-300"}`}>
                {reading?.value ?? "Unavailable"}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-neutral-400">
                {reading?.detail ?? "Could not load this count. Open the category to investigate; this does not mean zero."}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
