import { redirect } from "next/navigation";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { projectFrenchWardInstitutionalProfile } from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { FRENCH_WARD_COMMERCIAL_INTAKE } from "@/domains/institutions/french-ward";

import { InstitutionalAccessOperator } from "./InstitutionalAccessOperator";

export const dynamic = "force-dynamic";

export default async function InstitutionalAccessAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ requestId?: string }>;
}) {
  const principal = await getPrincipal();

  if (!principal) {
    redirect("/login");
  }

  if (
    !principal.permissions.includes(
      PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE,
    )
  ) {
    return <main style={{ padding: 32 }}>Access denied.</main>;
  }

  const params = await searchParams;
  const requestedRequestId = params?.requestId?.trim() ?? "";

  if (requestedRequestId.length > 191) {
    return (
      <main style={{ padding: 32 }}>
        Invalid request identifier.
      </main>
    );
  }

  const [requests, grants] = await Promise.all([
    prisma.institutionalAccessRequest.findMany({
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: 200,
      include: {
        grant: {
          select: {
            id: true,
            expiresAt: true,
            revokedAt: true,
            recipientEmail: true,
            firstAccessAt: true,
            lastAccessAt: true,
          },
        },
        events: {
          orderBy: {
            occurredAt: "desc",
          },
          take: 8,
          select: {
            id: true,
            type: true,
            occurredAt: true,
            reason: true,
          },
        },
      },
    }),

    prisma.institutionalAccessGrant.findMany({
      orderBy: [
        { issuedAt: "desc" },
        { id: "desc" },
      ],
      take: 200,
      select: {
        id: true,
        requestId: true,
        recipientUserId: true,
        recipientEmail: true,
        scope: true,
        resourceReference: true,
        resourceVersion: true,
        issuedAt: true,
        expiresAt: true,
        revokedAt: true,
        firstAccessAt: true,
        lastAccessAt: true,

        request: {
          select: {
            requesterName: true,
            institutionalAffiliation: true,
            requesterCapacity: true,
            purpose: true,
            status: true,
            decisionPolicy: true,
          },
        },

        buyerDossierItem: {
          select: {
            dossierId: true,
            dossier: {
              select: {
                purpose: true,
                expiresAt: true,
                revokedAt: true,
              },
            },
          },
        },

        buyerDossierLoi: {
          select: {
            id: true,
            purpose: true,
            expiresAt: true,
            revokedAt: true,
          },
        },
      },
    }),
  ]);

  const noticeRows = requests.length
    ? await prisma.profileAccessNoticeDelivery.findMany({
        where: {
          requestId: {
            in: requests.map((request) => request.id),
          },
        },
        orderBy: [
          { attemptedAt: "desc" },
          { id: "desc" },
        ],
        select: {
          requestId: true,
          status: true,
          messageId: true,
          attemptedAt: true,
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
    if (latestNoticeByRequest.has(notice.requestId)) {
      continue;
    }

    latestNoticeByRequest.set(notice.requestId, {
      status: notice.status,
      messageId: notice.messageId,
      attemptedAt: notice.attemptedAt.toISOString(),
    });
  }

  const pendingEmails = [
    ...new Set(
      requests
        .filter((request) => request.status === "PENDING")
        .map((request) => request.requesterEmail),
    ),
  ];

  const users = pendingEmails.length
    ? await prisma.user.findMany({
        where: {
          email: {
            in: pendingEmails,
          },
        },
        select: {
          id: true,
          email: true,
        },
      })
    : [];

  const userByEmail = new Map(
    users.map((user) => [
      user.email.toLowerCase(),
      user.id,
    ]),
  );

  const now = new Date();
  const currentProfile = projectFrenchWardInstitutionalProfile();

  return (
    <InstitutionalAccessOperator
      initialRequestId={requestedRequestId || null}
      notices={Object.fromEntries(latestNoticeByRequest)}
      requests={requests.map((request) => ({
        id: request.id,
        requesterName: request.requesterName,
        requesterEmail: request.requesterEmail,
        institutionalAffiliation:
          request.institutionalAffiliation,
        requesterCapacity: request.requesterCapacity,
        purpose: request.purpose,
        scope: request.scope,
        resourceReference: request.resourceReference,
        resourceVersion: request.resourceVersion,
        status: request.status,
        decisionPolicy: request.decisionPolicy,
        currentResourceVersion:
          request.scope === "PROFILE_VIEW"
            ? currentProfile.version
            : request.scope === "LOI_INTAKE_ACCESS"
              ? FRENCH_WARD_COMMERCIAL_INTAKE.version
              : request.resourceVersion,
        isCurrentResource:
          request.scope === "PROFILE_VIEW"
            ? request.resourceReference === currentProfile.reference &&
              request.resourceVersion === currentProfile.version
            : request.scope === "LOI_INTAKE_ACCESS"
              ? request.resourceReference ===
                  FRENCH_WARD_COMMERCIAL_INTAKE.reference &&
                request.resourceVersion ===
                  FRENCH_WARD_COMMERCIAL_INTAKE.version
              : true,
        createdAt: request.createdAt.toISOString(),
        decidedAt: request.decidedAt?.toISOString() ?? null,
        decisionReason: request.decisionReason,
        recipientUserId:
          userByEmail.get(
            request.requesterEmail.toLowerCase(),
          ) ?? null,
        grant: request.grant
          ? {
              id: request.grant.id,
              expiresAt:
                request.grant.expiresAt.toISOString(),
              revokedAt:
                request.grant.revokedAt?.toISOString() ??
                null,
              recipientEmail:
                request.grant.recipientEmail,
              firstAccessAt:
                request.grant.firstAccessAt?.toISOString() ??
                null,
              lastAccessAt:
                request.grant.lastAccessAt?.toISOString() ??
                null,
            }
          : null,
        events: request.events.map((event) => ({
          ...event,
          occurredAt: event.occurredAt.toISOString(),
        })),
      }))}
      grants={grants.map((grant) => {
        const state =
          grant.revokedAt
            ? "REVOKED"
            : grant.expiresAt <= now
              ? "EXPIRED"
              : grant.issuedAt > now
                ? "SCHEDULED"
                : "CURRENT";

        const provenance =
          grant.buyerDossierItem
            ? {
                kind: "BUYER_DOSSIER",
                label: "Buyer dossier",
                dossierId:
                  grant.buyerDossierItem.dossierId,
                dossierPurpose:
                  grant.buyerDossierItem.dossier.purpose,
                dossierRevokedAt:
                  grant.buyerDossierItem.dossier.revokedAt?.toISOString() ??
                  null,
              }
            : grant.buyerDossierLoi
              ? {
                  kind: "BUYER_DOSSIER_LOI",
                  label: "Buyer dossier · Commercial Intake",
                  dossierId: grant.buyerDossierLoi.id,
                  dossierPurpose:
                    grant.buyerDossierLoi.purpose,
                  dossierRevokedAt:
                    grant.buyerDossierLoi.revokedAt?.toISOString() ??
                    null,
                }
              : grant.request.requesterCapacity ===
                    "INVITED_PROFILE_RECIPIENT"
                ? {
                    kind: "REPRESENTATIVE_INVITATION",
                    label: "Representative invitation",
                    dossierId: null,
                    dossierPurpose: null,
                    dossierRevokedAt: null,
                  }
                : grant.request.decisionPolicy ===
                    "INDIVIDUAL_OPERATOR_REVIEW_V1"
                  ? {
                      kind: "MANUAL_OPERATOR",
                      label: "Manual operator approval",
                      dossierId: null,
                      dossierPurpose: null,
                      dossierRevokedAt: null,
                    }
                  : {
                      kind: "INSTITUTIONAL_ACCESS",
                      label: "Institutional access",
                      dossierId: null,
                      dossierPurpose: null,
                      dossierRevokedAt: null,
                    };

        return {
          id: grant.id,
          requestId: grant.requestId,
          recipientUserId: grant.recipientUserId,
          recipientEmail: grant.recipientEmail,
          recipientName: grant.request.requesterName,
          institutionalAffiliation:
            grant.request.institutionalAffiliation,
          requesterCapacity:
            grant.request.requesterCapacity,
          purpose: grant.request.purpose,
          requestStatus: grant.request.status,
          decisionPolicy: grant.request.decisionPolicy,
          scope: grant.scope,
          resourceReference: grant.resourceReference,
          resourceVersion: grant.resourceVersion,
          issuedAt: grant.issuedAt.toISOString(),
          expiresAt: grant.expiresAt.toISOString(),
          revokedAt:
            grant.revokedAt?.toISOString() ?? null,
          firstAccessAt:
            grant.firstAccessAt?.toISOString() ?? null,
          lastAccessAt:
            grant.lastAccessAt?.toISOString() ?? null,
          state,
          provenance,
        };
      })}
    />
  );
}
