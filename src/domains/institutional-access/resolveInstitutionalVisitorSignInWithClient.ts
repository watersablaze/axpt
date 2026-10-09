import type { PrismaClient } from "@prisma/client";
import { resolveInstitutionalSignInEligibility } from "../auth/resolveInstitutionalSignInEligibility";
import { resolveInstitutionalAccessWithClient } from "./resolveInstitutionalAccessWithClient";

export async function resolveInstitutionalVisitorSignInWithClient(params: {
  client: Pick<PrismaClient, "institutionalAccessGrant">;
  userId: string;
  email: string;
  roles?: string[];
  permissions?: string[];
  representativeProgramParticipants?: Array<{ standing: string }>;
}) {
  const existing = resolveInstitutionalSignInEligibility(params);
  if (existing.eligible) return existing;

  const email = params.email.trim().toLowerCase();
  if (!params.userId || !email) return existing;

  const now = new Date();
  const candidates = await params.client.institutionalAccessGrant.findMany({
    where: {
      recipientUserId: params.userId,
      recipientEmail: email,
      issuedAt: { lte: now },
      expiresAt: { gt: now },
      revokedAt: null,
      scope: { in: ["PROFILE_VIEW", "LOI_INTAKE_ACCESS"] },
    },
    select: {
      scope: true,
      resourceReference: true,
      resourceVersion: true,
    },
  });

  for (const candidate of candidates) {
    if (
      candidate.scope !== "PROFILE_VIEW" &&
      candidate.scope !== "LOI_INTAKE_ACCESS"
    ) continue;

    const access = await resolveInstitutionalAccessWithClient({
      client: params.client,
      identity: { userId: params.userId, email },
      scope: candidate.scope,
      action: candidate.scope === "PROFILE_VIEW" ? "VIEW" : "VIEW_FORM",
      resourceReference: candidate.resourceReference,
      resourceVersion: candidate.resourceVersion,
      now,
    });

    if (access.allowed) {
      return {
        eligible: true,
        audience: "INSTITUTIONAL_VISITOR",
      } as const;
    }
  }

  return existing;
}
