import type { PrismaClient } from "@prisma/client";
import type { Principal } from "@/domains/auth/types";
import { PERMISSIONS } from "@/domains/auth/permissions";
type Reading = { value: string; detail: string };
type Check = { title: string; href: string; read: () => Promise<Reading> };

// Caller must enforce Admin authorization. No shared or cross-user cache.
export async function loadAdminAttention(prisma: Pick<PrismaClient,
  "institutionalAccessRequest" | "transactionIntake" | "frenchWardInquiry" |
  "communicationConversation" | "emailLog">, principal: Principal, includeAlerts = true) {
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

  if (includeAlerts) checks.push({
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
  const readings = checks.map((check, index) => ({
    title: check.title, href: check.href,
    reading: results[index].status === "fulfilled"
      ? (results[index] as PromiseFulfilledResult<Reading>).value : null,
  }));
  const pending = readings.filter(row => ["Profile requests", "LOI access requests", "Transaction reviews", "General inquiries"].includes(row.title));
  const field = readings.find(row => row.title === "New field activity");
  return {
    readings,
    checkedAt: new Date().toISOString(),
    pending: pending.every(row => row.reading !== null)
      ? String(pending.reduce((sum, row) => sum + Number(row.reading!.value), 0)) : null,
    field: field ? field.reading?.value ?? null : undefined,
  };

}
