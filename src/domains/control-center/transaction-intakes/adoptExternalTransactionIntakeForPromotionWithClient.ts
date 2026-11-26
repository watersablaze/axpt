import { createHash } from "node:crypto";
import type { PrismaClient } from "@axpt/source-authority-join";

import {
  FRENCH_WARD_INSTITUTIONAL_PROFILE,
} from "@/domains/institutions/french-ward/canonicalInstitutionalProfile";
import {
  FRENCH_WARD_ACTION,
  resolveFrenchWardActionAuthorityWithClient,
} from "@/domains/institutions/french-ward/governance/resolveFrenchWardActionAuthorityWithClient";
import { verifySignedPersistedSession } from "@/lib/auth/verifySignedPersistedSession";

import { readExternalIntakeProvenance } from "./readExternalIntakeProvenance";

const policyVersion = "AXPT-AUTH-ZKKM-1B";
const action = FRENCH_WARD_ACTION.ADOPT_EXTERNAL_TRANSACTION_INTAKE;

type AdoptionTransaction = Pick<
  PrismaClient,
  | "$queryRaw"
  | "session"
  | "frenchWardGoverningOfficer"
  | "transactionIntake"
  | "transactionIntakeEvent"
  | "institutionalMatterRecord"
  | "externalTransactionIntakeAdoption"
  | "institutionalMatterEvent"
>;

type AdoptionInput = {
  client: Pick<PrismaClient, "$transaction">;
  sessionToken: string;
  signingSecret: Parameters<typeof verifySignedPersistedSession>[1];
  intakeId: string;
  matterId: string;
  reviewedCoordinationAuthorityReference: string;
  provenanceFindings: string;
};

export async function adoptExternalTransactionIntakeForPromotionWithClient(
  input: AdoptionInput,
) {
  const coordinationAuthorityReference =
    input.reviewedCoordinationAuthorityReference.trim();
  const provenanceFindings = input.provenanceFindings.trim();

  if (!coordinationAuthorityReference || !provenanceFindings) {
    throw new Error("FW_EXTERNAL_ADOPTION_EVIDENCE_REQUIRED");
  }

  return input.client.$transaction(async (tx: AdoptionTransaction) => {
    const session = await verifySignedPersistedSession(
      input.sessionToken,
      input.signingSecret,
      async (tokenId) => {
        await tx.$queryRaw`
          SELECT id FROM "Session" WHERE "tokenId" = ${tokenId} FOR UPDATE
        `;
        return tx.session.findUnique({
          where: { tokenId },
          select: {
            userId: true,
            status: true,
            expiresAt: true,
            invalidatedAt: true,
            endedAt: true,
          },
        });
      },
    );

    if (!session?.userId) {
      throw new Error("FW_EXTERNAL_ADOPTION_SESSION_REQUIRED");
    }

    await tx.$queryRaw`
      SELECT id FROM "FrenchWardGoverningOfficer"
      WHERE "userId" = ${session.userId} FOR UPDATE
    `;
    const authority = await resolveFrenchWardActionAuthorityWithClient({
      client: tx,
      userId: session.userId,
      action,
    });
    if (!authority.allowed) {
      throw new Error("FW_EXTERNAL_ADOPTION_AUTHORITY_REQUIRED");
    }

    await tx.$queryRaw`
      SELECT id FROM "TransactionIntake" WHERE id = ${input.intakeId} FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT id FROM "InstitutionalMatter" WHERE id = ${input.matterId} FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT id FROM "InstitutionalMatterRecord"
      WHERE "recordKind" = 'INTAKE' AND "recordId" = ${input.intakeId} FOR UPDATE
    `;

    const intake = await tx.transactionIntake.findUnique({
      where: { id: input.intakeId },
      select: { id: true, reference: true, status: true, promotedOpportunityId: true },
    });
    const binding = await tx.institutionalMatterRecord.findUnique({
      where: {
        recordKind_recordId: { recordKind: "INTAKE", recordId: input.intakeId },
      },
      include: { matter: true },
    });
    const principalReference = FRENCH_WARD_INSTITUTIONAL_PROFILE.reference;
    if (
      !intake ||
      !binding ||
      binding.recordReference !== intake.reference ||
      binding.matterId !== input.matterId ||
      binding.canonicalPrincipalReference !== principalReference ||
      !binding.canonicalBindingEvidenceReference ||
      binding.matter.institutionalDomain !== "FRENCH_WARD" ||
      binding.matter.coordinationEnvironment !== "AXPT" ||
      binding.matter.matterKind !== "COMMERCIAL_TRANSACTION"
    ) {
      throw new Error("FW_EXTERNAL_ADOPTION_SCOPE_REQUIRED");
    }

    const registrations = await tx.transactionIntakeEvent.findMany({
      where: { intakeId: intake.id, eventType: "EXTERNAL_INTAKE_REGISTERED" },
      take: 2,
    });
    const registration = registrations[0];
    const provenance = readExternalIntakeProvenance(registration?.note ?? null);
    if (registrations.length !== 1 || !provenance) {
      throw new Error("FW_EXTERNAL_ADOPTION_PROVENANCE_REQUIRED");
    }

    const evidence = {
      intakeReference: intake.reference,
      matterReference: binding.matter.reference,
      bindingId: binding.id,
      bindingEvidenceReference: binding.canonicalBindingEvidenceReference,
      source: provenance,
      coordinationAuthorityReference,
      provenanceFindings,
      buyerSignatoryAuthority: "UNVERIFIED",
      buyerAcceptance: "UNVERIFIED",
    };
    const decision = {
      intakeId: intake.id,
      matterId: binding.matterId,
      canonicalPrincipalReference: principalReference,
      externalRegistrationEventId: registration.id,
      issuerUserId: session.userId,
      governingReference: authority.standing.reference,
      policyVersion,
      action,
      result: "ADOPTED",
      evidence,
    };
    const decisionFingerprint = createHash("sha256")
      .update(JSON.stringify(decision))
      .digest("hex");

    const existing = await tx.externalTransactionIntakeAdoption.findUnique({
      where: { intakeId: intake.id },
    });
    if (existing) {
      if (existing.decisionFingerprint !== decisionFingerprint) {
        throw new Error("FW_EXTERNAL_ADOPTION_DECISION_CONFLICT");
      }
      return { decisionId: existing.id, alreadyAdopted: true };
    }

    if (
      intake.status !== "QUALIFIED" ||
      intake.promotedOpportunityId ||
      binding.matter.currentRecordKind !== "INTAKE" ||
      binding.matter.currentRecordId !== intake.id ||
      binding.matter.currentRecordReference !== intake.reference
    ) {
      throw new Error("FW_EXTERNAL_ADOPTION_INTAKE_NOT_ELIGIBLE");
    }

    const adopted = await tx.externalTransactionIntakeAdoption.create({
      data: {
        intakeId: decision.intakeId,
        matterId: decision.matterId,
        canonicalPrincipalReference: decision.canonicalPrincipalReference,
        externalRegistrationEventId: decision.externalRegistrationEventId,
        issuerUserId: decision.issuerUserId,
        governingReference: decision.governingReference,
        policyVersion,
        decisionFingerprint,
        evidence: { ...evidence, action, result: decision.result },
      },
    });
    await tx.institutionalMatterEvent.create({
      data: {
        matterId: binding.matterId,
        eventType: "EXTERNAL_INTAKE_ADOPTED",
        actor: session.userId,
        message: "External documentary intake adopted for governed promotion.",
        metadata: {
          adoptionDecisionId: adopted.id,
          intakeId: intake.id,
          registrationEventId: registration.id,
          policyVersion,
        },
      },
    });

    return { decisionId: adopted.id, alreadyAdopted: false };
  });
}
