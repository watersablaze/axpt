import { NextResponse } from "next/server";
import { z } from "zod";

import { promoteAdoptedOpportunityToDossierWithClient } from "@/domains/control-center/opportunities/promoteOpportunityToDossier";
import { advanceAdoptedExternalIntakeDossierWithClient } from "@/domains/control-center/dossiers/advanceAdoptedExternalIntakeDossierWithClient";
import { adoptExternalTransactionIntakeForPromotionWithClient } from "@/domains/control-center/transaction-intakes/adoptExternalTransactionIntakeForPromotionWithClient";
import { promoteAdoptedExternalTransactionIntakeToOpportunity } from "@/domains/control-center/transaction-intakes/promoteTransactionIntakeToOpportunity";
import { prisma } from "@/infrastructure/db/prisma";
import { SIGNING_SECRET } from "@/infrastructure/env/secrets";
import { getTokenFromCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const id = z.string().trim().min(1).max(128);
const decision = { adoptionDecisionId: id };
const recordPair = { intakeId: id, matterId: id };

const workflowInput = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("ADOPT"),
    ...recordPair,
    reviewedCoordinationAuthorityReference: z.string().trim().min(1).max(500),
    provenanceFindings: z.string().trim().min(1).max(4000),
  }).strict(),
  z.object({
    operation: z.literal("PROMOTE"),
    ...recordPair,
    ...decision,
  }).strict(),
  z.object({
    operation: z.literal("CREATE_DOSSIER"),
    opportunityId: id,
    ...decision,
  }).strict(),
  z.object({
    operation: z.literal("OPEN_KYC_REVIEW"),
    dossierId: id,
    ...decision,
  }).strict(),
  z.object({
    operation: z.literal("OPEN_SPA_DRAFTING"),
    dossierId: id,
    ...decision,
  }).strict(),
]);

const denied = new Set([
  "FW_EXTERNAL_ADOPTION_AUTHORITY_REQUIRED",
  "FW_EXTERNAL_ADOPTION_SCOPE_REQUIRED",
  "FW_EXTERNAL_PROMOTION_GOVERNING_AUTHORITY_REQUIRED",
  "FW_EXTERNAL_PROMOTION_PERMISSION_REQUIRED",
  "DOSSIER_APPROVAL_GATE_BLOCKED",
]);
const conflicts = new Set([
  "FW_EXTERNAL_ADOPTION_PROVENANCE_REQUIRED",
  "FW_EXTERNAL_ADOPTION_DECISION_CONFLICT",
  "FW_EXTERNAL_ADOPTION_INTAKE_NOT_ELIGIBLE",
  "FW_EXTERNAL_PROMOTION_ADOPTION_MISMATCH",
  "FW_DOSSIER_ADOPTION_MISMATCH",
  "FW_DOSSIER_EXPECTED_STATE_MISMATCH",
  "DOSSIER_PROFILE_TRANSITION_BLOCKED",
  "DOSSIER_ARTIFACT_GATE_BLOCKED",
  "TRANSACTION_INTAKE_NOT_QUALIFIED",
  "OPPORTUNITY_NOT_APPROVED",
]);

function failure(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const host = request.headers.get("host");
  const protocol = new URL(request.url).protocol;
  const expectedOrigin = host ? `${protocol}//${host}` : null;
  if (!expectedOrigin || request.headers.get("origin") !== expectedOrigin) {
    return failure("FORBIDDEN_ORIGIN", 403);
  }

  const sessionToken = await getTokenFromCookie();
  if (!sessionToken) return failure("UNAUTHORIZED", 401);

  const parsed = workflowInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("INVALID_WORKFLOW_INPUT", 400);

  const input = parsed.data;
  const context = { client: prisma, sessionToken, signingSecret: SIGNING_SECRET };

  try {
    if (input.operation === "ADOPT") {
      const result = await adoptExternalTransactionIntakeForPromotionWithClient({
        ...context,
        ...input,
      });
      return NextResponse.json({ ok: true, result });
    }
    if (input.operation === "PROMOTE") {
      const result = await promoteAdoptedExternalTransactionIntakeToOpportunity({
        ...context,
        ...input,
      });
      return NextResponse.json({ ok: true, result });
    }

    if (input.operation === "CREATE_DOSSIER") {
      const result = await promoteAdoptedOpportunityToDossierWithClient(
        prisma,
        input.opportunityId,
        { ...context, adoptionDecisionId: input.adoptionDecisionId },
      );
      return NextResponse.json({ ok: true, result });
    }

    const transition = input.operation === "OPEN_KYC_REVIEW"
      ? { fromState: "INTAKE_PENDING", toState: "KYC_REVIEW" } as const
      : { fromState: "KYC_REVIEW", toState: "SPA_DRAFTING" } as const;
    const result = await advanceAdoptedExternalIntakeDossierWithClient({
      ...context,
      ...input,
      ...transition,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message.split(":")[0] : "";
    if (
      code === "FW_EXTERNAL_ADOPTION_SESSION_REQUIRED" ||
      code === "FW_EXTERNAL_PROMOTION_SESSION_REQUIRED"
    ) {
      return failure("UNAUTHORIZED", 401);
    }
    if (denied.has(code)) return failure("WORKFLOW_ACCESS_DENIED", 403);
    if (conflicts.has(code)) return failure(code, 409);
    if (code === "TRANSACTION_INTAKE_NOT_FOUND") {
      return failure("WORKFLOW_RECORD_NOT_FOUND", 404);
    }

    console.error("[FW_EXTERNAL_INTAKE_WORKFLOW_FAILED]");
    return failure("WORKFLOW_FAILED", 500);
  }
}
