import { redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { InstitutionalAccessOperator } from "./InstitutionalAccessOperator";

export const dynamic = "force-dynamic";

export default async function InstitutionalAccessAdminPage() {
  const principal = await getPrincipal();
  if (!principal) redirect("/login");
  if (!principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) {
    return <main style={{padding:32}}>Access denied.</main>;
  }
  const [requests, grants] = await Promise.all([
    prisma.institutionalAccessRequest.findMany({
      where: { scope: "PROFILE_VIEW" },
      orderBy: { createdAt: "desc" }, take: 100,
      include: { grant: { select: { id: true, expiresAt: true, revokedAt: true, recipientEmail: true } }, events: { orderBy: {occurredAt: "desc"}, take: 6, select: { id:true, type:true, occurredAt:true, reason:true } } },
    }),
    prisma.institutionalAccessGrant.findMany({
      where: { scope: "PROFILE_VIEW" },
      orderBy: { issuedAt: "desc" }, take: 100,
      select: { id:true, requestId:true, recipientEmail:true, scope:true, resourceReference:true, resourceVersion:true, issuedAt:true, expiresAt:true, revokedAt:true },
    }),
  ]);
  const emails = [...new Set(requests.filter(r => r.status === "PENDING").map(r => r.requesterEmail))];
  const users = emails.length ? await prisma.user.findMany({where:{email:{in:emails}},select:{id:true,email:true}}) : [];
  const userByEmail = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  return <InstitutionalAccessOperator
    requests={requests.map(r => ({id:r.id, requesterName:r.requesterName, requesterEmail:r.requesterEmail, institutionalAffiliation:r.institutionalAffiliation, requesterCapacity:r.requesterCapacity, purpose:r.purpose, scope:r.scope, resourceReference:r.resourceReference, resourceVersion:r.resourceVersion, status:r.status, createdAt:r.createdAt.toISOString(), decisionReason:r.decisionReason, recipientUserId:userByEmail.get(r.requesterEmail.toLowerCase()) ?? null, grant:r.grant && { ...r.grant,expiresAt:r.grant.expiresAt.toISOString(),revokedAt:r.grant.revokedAt?.toISOString() ?? null }, events:r.events.map(e=>({...e,occurredAt:e.occurredAt.toISOString()})) }))}
    grants={grants.map(g=>({...g,issuedAt:g.issuedAt.toISOString(),expiresAt:g.expiresAt.toISOString(),revokedAt:g.revokedAt?.toISOString() ?? null}))}
  />;
}
