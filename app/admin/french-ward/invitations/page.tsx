import "server-only";

import { redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import InvitationWorkspace from "./InvitationWorkspace";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "French-Ward Institutional Invitations | AXPT",
  robots: { index: false, follow: false },
};

export default async function InstitutionalInvitationsPage() {
  const principal = await getPrincipal();

  if (!principal) {
    redirect("/login?next=%2Fadmin%2Ffrench-ward%2Finvitations");
  }

  if (
    !principal.permissions.includes(
      PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE
    )
  ) {
    return <main className="p-8">Access denied.</main>;
  }

  const issuer = await prisma.user.findUnique({
    where: { id: principal.userId },
    select: { isAdmin: true },
  });

  const [invitations, deliveries] = await Promise.all([
    prisma.frenchWardInstitutionalInvitation.findMany({
      orderBy: { issuedAt: "desc" },
      take: 50,
      select: {
        id: true,
        reference: true,
        recipientDisplayName: true,
        recipientEmail: true,
        participantReference: true,
        institutionalTitle: true,
        capacityClass: true,
        issuedAt: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
      },
    }),
    prisma.frenchWardInstitutionalInvitationDelivery.findMany({
      orderBy: { claimedAt: "desc" },
      take: 100,
      select: {
        invitationId: true,
        status: true,
        claimedAt: true,
        resolvedAt: true,
      },
    }),
  ]);

  const deliveryByInvitation = new Map(
    deliveries.map(row => [row.invitationId, row])
  );

  return (
    <InvitationWorkspace
      previewOnly={false}
      issuerEligible={issuer?.isAdmin === true}
      records={invitations.map(invitation => {
        const delivery = deliveryByInvitation.get(invitation.id);
        return {
          reference: invitation.reference,
          recipientDisplayName: invitation.recipientDisplayName,
          recipientEmail: invitation.recipientEmail,
          participantReference: invitation.participantReference,
          institutionalTitle: invitation.institutionalTitle,
          capacityClass: invitation.capacityClass,
          issuedAt: invitation.issuedAt.toISOString(),
          expiresAt: invitation.expiresAt.toISOString(),
          acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
          revokedAt: invitation.revokedAt?.toISOString() ?? null,
          deliveryStatus: delivery?.status ?? "UNRECORDED",
        };
      })}
    />
  );
}
