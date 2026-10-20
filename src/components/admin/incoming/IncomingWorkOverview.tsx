import Link from "next/link";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";

type Reading = { value: string; detail: string };
type Check = {
  title: string;
  href: string;
  read: () => Promise<Reading>;
};

export default async function IncomingWorkOverview() {
  const principal = await getPrincipal();
  if (!principal || !isAdmin(principal)) return null;

  const checks: Check[] = [];
  const pendingAccess = (scope: "PROFILE_VIEW" | "LOI_INTAKE_ACCESS") =>
    async (): Promise<Reading> => ({
      value: String(await prisma.institutionalAccessRequest.count({
        where: { status: "PENDING", scope },
      })),
      detail: "Awaiting your access decision.",
    });

  if (principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) {
    checks.push(
      {
        title: "Profile requests",
        href: "/admin/incoming?lane=access",
        read: pendingAccess("PROFILE_VIEW"),
      },
      {
        title: "LOI access requests",
        href: "/admin/incoming?lane=access",
        read: pendingAccess("LOI_INTAKE_ACCESS"),
      },
    );
  }

  checks.push(
    {
      title: "Transaction reviews",
      href: "/admin/incoming?lane=transactions",
      read: async () => ({
        value: String(await prisma.transactionIntake.count({
          where: {
            status: { in: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_CLARIFICATION"] },
          },
        })),
        detail: "Submitted, in review, or awaiting clarification.",
      }),
    },
    {
      title: "General inquiries",
      href: "/admin/incoming?lane=general",
      read: async () => ({
        value: String(await prisma.frenchWardInquiry.count({
          where: { status: { in: ["OPEN", "IN_REVIEW"] } },
        })),
        detail: "Open or in review.",
      }),
    },
  );

  if (principal.permissions.includes(PERMISSIONS.COMMUNICATIONS_ACCESS)) {
    checks.push({
      title: "New field activity",
      href: "/admin/incoming?lane=field",
      read: async () => {
        const records = await prisma.communicationConversation.findMany({
          where: {
            status: "ACTIVE",
            members: { some: { userId: principal.userId, leftAt: null } },
            operationalRoom: {
              is: { clientRoomId: { startsWith: "arp-field:" } },
            },
          },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take: 101,
          select: {
            members: {
              where: { userId: principal.userId, leftAt: null },
              select: {
                lastReadMessage: { select: { createdAt: true } },
              },
            },
            messages: {
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              take: 1,
              select: { senderUserId: true, createdAt: true },
            },
          },
        });

        const count = records.slice(0, 100).filter((record: {
          messages: Array<{ senderUserId: string; createdAt: Date }>;
          members: Array<{
            lastReadMessage: { createdAt: Date } | null;
          }>;
        }) => {
          const latest = record.messages[0];
          const readAt = record.members[0]?.lastReadMessage?.createdAt;
          return latest &&
            latest.senderUserId !== principal.userId &&
            (!readAt || latest.createdAt > readAt);
        }).length;

        return {
          value: records.length > 100 ? `${count} in latest 100` : String(count),
          detail: "Conversations whose latest incoming message is unread. This is not an unresolved-task count.",
        };
      },
    });
  }

  checks.push({
    title: "Alerts needing review",
    href: "/admin/incoming/alerts",
    read: async () => {
      const now = Date.now();
      const count = await prisma.emailLog.count({
        where: {
          type: { startsWith: "ADMIN_INCOMING_V1:" },
          OR: [
            { status: { in: ["FAILED", "DELIVERY_UNCERTAIN", "LOGGED_ONLY"] } },
            {
              status: "QUEUED",
              updatedAt: { lt: new Date(now - 2 * 60_000) },
            },
            {
              status: "SENDING",
              updatedAt: { lt: new Date(now - 5 * 60_000) },
            },
          ],
        },
      });
      return {
        value: String(count),
        detail: "Failed, held, log-only, or delayed Admin alerts. Review before retrying.",
      };
    },
  });

  const results = await Promise.allSettled(checks.map(check => check.read()));

  return (
    <section aria-labelledby="incoming-overview" className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[.16em] text-amber-200">
            Current position
          </p>
          <h2 id="incoming-overview" className="mt-2 text-2xl font-medium text-white">
            Attention
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Counts checked when this page loads. Open the relevant workspace to act.
          </p>
        </div>
        <Link href="/admin/incoming" className="text-sm text-cyan-200 underline underline-offset-4">
          Open Incoming work →
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
        {checks.map((check, index) => {
          const result = results[index];
          const reading = result.status === "fulfilled" ? result.value : null;

          return (
            <Link
              key={check.title}
              href={check.href}
              className="border-b border-neutral-800 py-4 transition-colors hover:border-cyan-400/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              <h2 className="text-sm font-medium text-neutral-200">{check.title}</h2>
              <p className={`mt-2 text-2xl tabular-nums ${reading ? "text-amber-100" : "text-amber-300"}`}>
                {reading?.value ?? "Unavailable"}
              </p>
              <p className="mt-3 text-xs leading-5 text-neutral-400">
                {reading?.detail ?? "Could not load this count. Open the category to investigate; this does not mean zero."}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
