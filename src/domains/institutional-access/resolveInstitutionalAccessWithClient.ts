import type { PrismaClient } from "@prisma/client";

export type InstitutionalAccessScope =
  | "PROFILE_VIEW"
  | "SOURCE_AUTHORITY_VIEW"
  | "SUPPORTING_DOCUMENT_VIEW"
  | "LOI_INTAKE_ACCESS";

export type InstitutionalAccessAction =
  | "VIEW"
  | "VIEW_FORM"
  | "SUBMIT_INTAKE";

type AccessClient = Pick<
  PrismaClient,
  "institutionalAccessGrant"
>;

export type InstitutionalAccessIdentity = {
  userId: string;
  email: string;
};

export function institutionalScopeAllowsAction(
  scope: InstitutionalAccessScope,
  action: InstitutionalAccessAction,
): boolean {
  return (
    (["PROFILE_VIEW", "SOURCE_AUTHORITY_VIEW", "SUPPORTING_DOCUMENT_VIEW"].includes(scope) && action === "VIEW") ||
    (scope === "LOI_INTAKE_ACCESS" &&
      (action === "VIEW_FORM" || action === "SUBMIT_INTAKE"))
  );
}

/**
 * identity must come from the canonical authenticated principal.
 * Resource reference, version, scope and action must come from
 * server-owned consumer configuration, never request-body claims.
 *
 * This resolver performs no writes and grants no ARP authority.
 * Mutation consumers must coordinate this check with their write
 * and grant revocation through the shared transaction contract.
 */
export async function resolveInstitutionalAccessWithClient(params: {
  client: AccessClient;
  identity: InstitutionalAccessIdentity;
  scope: InstitutionalAccessScope;
  action: InstitutionalAccessAction;
  resourceReference: string;
  resourceVersion: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const email = params.identity.email.trim().toLowerCase();

  if (
    !params.identity.userId ||
    !email ||
    !params.resourceReference.trim() ||
    !Number.isInteger(params.resourceVersion) ||
    params.resourceVersion <= 0 ||
    !Number.isFinite(now.getTime()) ||
    !institutionalScopeAllowsAction(params.scope, params.action)
  ) {
    return { allowed: false, reason: "ACCESS_DENIED" } as const;
  }

  const grant = await params.client.institutionalAccessGrant.findFirst({
    where: {
      recipientUserId: params.identity.userId,
      recipientEmail: email,
      scope: params.scope,
      resourceReference: params.resourceReference,
      resourceVersion: params.resourceVersion,
      issuedAt: { lte: now },
      expiresAt: { gt: now },
      revokedAt: null,
      recipient: {
        email,
      },
      request: {
        status: "APPROVED",
        requesterEmail: email,
        scope: params.scope,
        resourceReference: params.resourceReference,
        resourceVersion: params.resourceVersion,
      },
    },
    orderBy: [
      { issuedAt: "desc" },
      { id: "asc" },
    ],
    select: {
      id: true,
      requestId: true,
      recipientUserId: true,
      scope: true,
      resourceReference: true,
      resourceVersion: true,
      expiresAt: true,
    },
  });

  if (!grant) {
    return { allowed: false, reason: "ACCESS_DENIED" } as const;
  }

  return {
    allowed: true,
    action: params.action,
    grant,
  } as const;
}
