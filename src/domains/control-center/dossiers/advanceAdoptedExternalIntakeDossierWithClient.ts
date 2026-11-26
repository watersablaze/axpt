import type { Prisma, PrismaClient } from "@axpt/source-authority-join";

import { EventTypes } from "@/core/events/types";
import { FRENCH_WARD_INSTITUTIONAL_PROFILE } from "@/domains/institutions/french-ward/canonicalInstitutionalProfile";
import { buildTransitionAuditRecord } from "../buildTransitionAuditRecord";
import { checkDossierApprovalGate } from "../dossierApprovalGates";
import { checkDossierArtifactGate } from "../dossierArtifactGates";
import { canTransitionDossier } from "../dossierStateMachine";
import { generateTransitionArtifactsWithClient } from "../generateTransitionArtifacts";
import { getAvailableDossierTransitions } from "../getAvailableDossierTransitions";
import { inferDossierExecutionProfile } from "../inferDossierExecutionProfile";
import { authorizeExternalPromotion } from "../transaction-intakes/promoteTransactionIntakeToOpportunity";
import { getTransitionConsequences } from "../transitionConsequences";

type PreSpaTransition =
  | { fromState: "INTAKE_PENDING"; toState: "KYC_REVIEW" }
  | { fromState: "KYC_REVIEW"; toState: "SPA_DRAFTING" };

type Input = PreSpaTransition & {
  client: Pick<PrismaClient, "$transaction">;
  dossierId: string;
  adoptionDecisionId: string;
  sessionToken: string;
  signingSecret: Parameters<typeof authorizeExternalPromotion>[1]["signingSecret"];
};

export async function advanceAdoptedExternalIntakeDossierWithClient(input: Input) {
  const { fromState, toState, dossierId } = input;
  if (
    !(fromState === "INTAKE_PENDING" && toState === "KYC_REVIEW") &&
    !(fromState === "KYC_REVIEW" && toState === "SPA_DRAFTING")
  ) {
    throw new Error("FW_DOSSIER_PRE_SPA_TRANSITION_REQUIRED");
  }

  return input.client.$transaction(async (tx: Prisma.TransactionClient) => {
    const session = await authorizeExternalPromotion(tx, input);
    const operatorEmail = session.email;
    if (!operatorEmail) {
      throw new Error("FW_DOSSIER_OPERATOR_EMAIL_REQUIRED");
    }
    const decision = await tx.externalTransactionIntakeAdoption.findUnique({
      where: { id: input.adoptionDecisionId },
    });
    if (
      !decision ||
      decision.canonicalPrincipalReference !== FRENCH_WARD_INSTITUTIONAL_PROFILE.reference
    ) {
      throw new Error("FW_DOSSIER_ADOPTION_MISMATCH");
    }

    await tx.$queryRaw`
      SELECT id FROM "InstitutionalMatter" WHERE id = ${decision.matterId} FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT id FROM "TransactionDossier" WHERE id = ${dossierId} FOR UPDATE
    `;
    const dossier = await tx.transactionDossier.findUniqueOrThrow({
      where: { id: dossierId },
      include: {
        instruments: true,
        approvalRequirements: true,
        terms: true,
        parties: true,
        events: { orderBy: { createdAt: "desc" } },
        promotedOpportunities: {
          include: {
            sourceTransactionIntake: {
              select: { id: true, transactionType: true },
            },
          },
        },
      },
    });
    const matter = await tx.institutionalMatter.findUniqueOrThrow({
      where: { id: decision.matterId },
      include: { records: true },
    });
    const [opportunity] = dossier.promotedOpportunities;
    const intake = opportunity?.sourceTransactionIntake;
    const origin = matter.records.find(
      (record) => record.recordKind === "INTAKE" && record.recordId === decision.intakeId,
    );
    if (
      dossier.promotedOpportunities.length !== 1 ||
      intake?.id !== decision.intakeId ||
      origin?.canonicalPrincipalReference !== decision.canonicalPrincipalReference ||
      !origin.canonicalBindingEvidenceReference ||
      matter.institutionalDomain !== "FRENCH_WARD" ||
      matter.coordinationEnvironment !== "AXPT" ||
      matter.matterKind !== "COMMERCIAL_TRANSACTION" ||
      matter.currentRecordKind !== "DOSSIER" ||
      matter.currentRecordId !== dossier.id ||
      matter.currentRecordReference !== dossier.reference ||
      !matter.records.some(
        (record) => record.recordKind === "OPPORTUNITY" && record.recordId === opportunity.id,
      ) ||
      !matter.records.some(
        (record) => record.recordKind === "DOSSIER" &&
          record.recordId === dossier.id && record.recordReference === dossier.reference,
      )
    ) {
      throw new Error("FW_DOSSIER_ADOPTION_MISMATCH");
    }

    const previous = dossier.events.find(
      (event) => event.eventType === EventTypes.DOSSIER_STATE_TRANSITIONED &&
        event.fromState === fromState && event.toState === toState,
    );
    if (previous && (dossier.state === toState || dossier.state === "SPA_DRAFTING")) {
      return { dossierId, state: dossier.state, eventId: previous.id, alreadyTransitioned: true };
    }
    if (dossier.state !== fromState || !canTransitionDossier(fromState, toState)) {
      throw new Error("FW_DOSSIER_EXPECTED_STATE_MISMATCH");
    }

    const context = {
      settlement: dossier.settlement,
      transactionType: intake.transactionType,
      terms: dossier.terms,
    };
    if (!getAvailableDossierTransitions({ ...context, state: fromState })
      .some((transition) => transition.toState === toState)) {
      throw new Error("DOSSIER_PROFILE_TRANSITION_BLOCKED");
    }

    const artifactGate = checkDossierArtifactGate({
      fromState,
      toState,
      instruments: dossier.instruments,
      parties: dossier.parties,
      sourceOpportunities: dossier.promotedOpportunities,
      events: dossier.events,
      origin: dossier.origin,
      settlement: dossier.settlement,
      executionProfile: inferDossierExecutionProfile(context),
    });
    if (!artifactGate.passed) {
      throw new Error(`DOSSIER_ARTIFACT_GATE_BLOCKED: ${artifactGate.blockingReason}`);
    }

    const roles = await tx.userRole.findMany({
      where: { userId: session.userId, isActive: true, revokedAt: null },
      select: { role: { select: { key: true } } },
    });
    const approvalGate = checkDossierApprovalGate({
      fromState,
      toState,
      operatorRoles: roles.map(({ role }) => role.key),
      requirements: dossier.approvalRequirements,
    });
    if (!approvalGate.passed) {
      throw new Error("DOSSIER_APPROVAL_GATE_BLOCKED");
    }

    await tx.transactionDossier.update({ where: { id: dossierId }, data: { state: toState } });
    const artifacts = await generateTransitionArtifactsWithClient(tx, {
      dossierId,
      reference: dossier.reference,
      fromState,
      toState,
      operatorEmail,
    });
    const transitionAuditRecord = buildTransitionAuditRecord({
      dossierId,
      reference: dossier.reference,
      fromState,
      toState,
      operatorEmail,
      approvals: dossier.approvalRequirements,
      generatedArtifacts: artifacts.map(({ instrument }) => ({
        type: instrument.type,
        title: instrument.title,
        status: instrument.status,
        version: instrument.version,
      })),
      consequences: getTransitionConsequences({ fromState, toState }),
    });
    const message = `Dossier transitioned from ${fromState} to ${toState}.`;
    const attribution = {
      source: "control-center.external-intake-transition",
      adoptionDecisionId: decision.id,
      operatorId: session.userId,
      operatorEmail,
    };
    const event = await tx.transactionDossierEvent.create({
      data: {
        dossierId,
        eventType: EventTypes.DOSSIER_STATE_TRANSITIONED,
        fromState,
        toState,
        message,
        actor: operatorEmail,
        metadata: { ...attribution, transitionAuditRecord },
      },
    });
    await tx.domainEvent.create({
      data: {
        streamType: "DOSSIER",
        streamId: dossier.reference,
        eventType: EventTypes.DOSSIER_STATE_TRANSITIONED,
        payload: { dossierId, reference: dossier.reference, fromState, toState, message },
        metadata: { ...attribution, severity: "INFO" },
        occurredAt: new Date(),
      },
    });
    return { dossierId, state: toState, eventId: event.id, alreadyTransitioned: false };
  });
}
