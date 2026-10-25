import { redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { InstitutionalAccessOperator } from "./InstitutionalAccessOperator";

export const dynamic = "force-dynamic";

export default async function InstitutionalAccessAdminPage({ searchParams }: {
  searchParams?: Promise<{ requestId?: string }>;
}) {
  const principal = await getPrincipal();
  if (!principal) redirect("/login");
  if (!principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) {
    return <main style={{padding:32}}>Access denied.</main>;
  }
  const params = await searchParams;
  const requestId = params?.requestId?.trim();
  if (requestId && requestId.length > 191) {
    return <main style={{padding:32}}>Invalid request identifier.</main>;
  }
  const [requests, grants] = await Promise.all([
    prisma.institutionalAccessRequest.findMany({
      ...(requestId ? { where: { id: requestId } } : {}),
      orderBy: { createdAt: "desc" }, take: 100,
      include: { grant: { select: { id: true, expiresAt: true, revokedAt: true, recipientEmail: true } }, events: { orderBy: {occurredAt: "desc"}, take: 6, select: { id:true, type:true, occurredAt:true, reason:true } } },
    }),
    prisma.institutionalAccessGrant.findMany({
      orderBy: { issuedAt: "desc" }, take: 100,
      select: { id:true, requestId:true, recipientEmail:true, scope:true, resourceReference:true, resourceVersion:true, issuedAt:true, expiresAt:true, revokedAt:true },
    }),
  ]);
  // Latest persisted notice for each displayed request.
  // Read-only: never dispatch mail during page rendering.
  const noticeRows = requests.length
    ? await prisma.profileAccessNoticeDelivery.findMany({
        where: { requestId: { in: requests.map(r => r.id) } },
        orderBy: [{ attemptedAt: "desc" }, { id: "desc" }],
        select: {
          requestId: true,
          status: true,
          messageId: true,
          attemptedAt: true,
          actorUserId: true,
        },
      })
    : [];

  const latestNoticeByRequest = new Map<
    string,
    {
      status: string;
      messageId: string | null;
      attemptedAt: string;
    }
  >();

  for (const notice of noticeRows) {
    if (!latestNoticeByRequest.has(notice.requestId)) {
      latestNoticeByRequest.set(notice.requestId, {
        status: notice.status,
        messageId: notice.messageId,
        attemptedAt: notice.attemptedAt.toISOString(),
      });
    }
  }

  const emails = [...new Set(requests.filter(r => r.status === "PENDING").map(r => r.requesterEmail))];
  const users = emails.length ? await prisma.user.findMany({where:{email:{in:emails}},select:{id:true,email:true}}) : [];
  const userByEmail = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  return <InstitutionalAccessOperator
    requests={requests.map(r => ({id:r.id, requesterName:r.requesterName, requesterEmail:r.requesterEmail, institutionalAffiliation:r.institutionalAffiliation, requesterCapacity:r.requesterCapacity, purpose:r.purpose, scope:r.scope, resourceReference:r.resourceReference, resourceVersion:r.resourceVersion, status:r.status, createdAt:r.createdAt.toISOString(), decisionReason:r.decisionReason, recipientUserId:userByEmail.get(r.requesterEmail.toLowerCase()) ?? null, grant:r.grant && { ...r.grant,expiresAt:r.grant.expiresAt.toISOString(),revokedAt:r.grant.revokedAt?.toISOString() ?? null }, events:r.events.map(e=>({...e,occurredAt:e.occurredAt.toISOString()})) }))}
    notices={Object.fromEntries(latestNoticeByRequest)}
    grants={grants.map(g=>({...g,issuedAt:g.issuedAt.toISOString(),expiresAt:g.expiresAt.toISOString(),revokedAt:g.revokedAt?.toISOString() ?? null}))}
  />;
}
