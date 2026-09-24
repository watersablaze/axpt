import type { PrismaClient } from "@prisma/client";
import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_EVIDENCE_SUBJECT,
  INSTRUMENT_EVIDENCE_TYPE,
} from "../../../contracts";
import { REPRESENTATIVE_ONBOARDING_STATUS } from "../contracts";

type ExecutionEvidence = Readonly<{
  id: string;
  evidenceType: string;
  subjectType: string;
  uri: string | null;
  contentHash: string | null;
  metadata: unknown;
}>;

export type RepresentativeMasterAgreementBindingClient = Pick<
  PrismaClient,
  "user" | "representativeOnboardingIntake" | "institutionalInstrument" | "domainEvent"
>;

export type RepresentativeMasterAgreementBindingRunner = Pick<
  PrismaClient,
  "$transaction"
>;

function metadataField(metadata: unknown, key: string): unknown {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  return (metadata as Record<string, unknown>)[key];
}

function validEvidenceLocation(
  evidence: ExecutionEvidence,
): boolean {
  return (
    Boolean(evidence.uri?.trim()) &&
    /^(sha256:)?[a-f0-9]{64}$/i.test(evidence.contentHash ?? "")
  );
}

function hasCandidateSignature(
  evidence: ExecutionEvidence,
  candidateEmail: string,
): boolean {
  const metadata = evidence.metadata;
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return false;
  }

  const signerEmail = (metadata as Record<string, unknown>).signerEmail;

  return (
    evidence.evidenceType === INSTRUMENT_EVIDENCE_TYPE.DOCUMENT &&
    evidence.subjectType === INSTRUMENT_EVIDENCE_SUBJECT.EXECUTION &&
    Boolean(evidence.uri?.trim()) &&
    /^(sha256:)?[a-f0-9]{64}$/i.test(evidence.contentHash ?? "") &&
    typeof signerEmail === "string" &&
    signerEmail.trim().toLowerCase() === candidateEmail.trim().toLowerCase()
  );
}

/**
 * Bind an externally executed Master Agreement after Program admission.
 * The operation neither creates a Participant nor changes standing,
 * appointment, or authority.
 */
export async function bindRepresentativeMasterAgreementWithClient(params: {
  client: RepresentativeMasterAgreementBindingClient;
  intakeId: string;
  instrumentReference: string;
  actorUserId: string;
  occurredAt?: Date;
}) {
  const intakeId = params.intakeId.trim();
  const reference = params.instrumentReference.trim();
  const actorUserId = params.actorUserId.trim();

  if (!intakeId || !reference || !actorUserId) {
    throw new Error("[ARP_MASTER_AGREEMENT_BINDING_INPUT_REQUIRED]");
  }

  const actor = await params.client.user.findUnique({
    where: { id: actorUserId },
    select: { isAdmin: true },
  });

  if (!actor?.isAdmin) {
    throw new Error("[ARP_MASTER_AGREEMENT_ADMIN_REQUIRED]");
  }

  const intake = await params.client.representativeOnboardingIntake.findUnique({
    where: { id: intakeId },
    select: {
      id: true,
      status: true,
      candidateEmail: true,
      admittedParticipantId: true,
      masterAgreementInstrumentId: true,
    },
  });

  if (!intake) {
    throw new Error("[ARP_MASTER_AGREEMENT_INTAKE_NOT_FOUND]");
  }

  if (
    intake.status !== REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED ||
    !intake.admittedParticipantId
  ) {
    throw new Error("[ARP_MASTER_AGREEMENT_ADMISSION_REQUIRED]");
  }

  const agreement = await params.client.institutionalInstrument.findUnique({
    where: { reference },
    select: {
      id: true,
      kind: true,
      status: true,
      evidence: {
        where: {
          subjectType: INSTRUMENT_EVIDENCE_SUBJECT.EXECUTION,
        },
        select: {
          id: true,
          evidenceType: true,
          subjectType: true,
          uri: true,
          contentHash: true,
          metadata: true,
        },
      },
    },
  });

  if (
    !agreement ||
    agreement.kind !==
      INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_PROGRAM_AGREEMENT
  ) {
    throw new Error("[ARP_MASTER_AGREEMENT_INSTRUMENT_REQUIRED]");
  }

  if (agreement.status !== INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTED) {
    throw new Error("[ARP_MASTER_AGREEMENT_EXECUTION_REQUIRED]");
  }

  const signedDocuments = agreement.evidence.filter((item) =>
    hasCandidateSignature(item, intake.candidateEmail),
  );

  if (signedDocuments.length === 0) {
    throw new Error("[ARP_MASTER_AGREEMENT_SIGNED_EVIDENCE_REQUIRED]");
  }

  const matchedPair = signedDocuments
    .map((proof) => {
      const agreementId = metadataField(proof.metadata, "adobeAgreementId");
      if (
        typeof agreementId !== "string" ||
        !agreementId.trim() ||
        metadataField(proof.metadata, "operatorConfirmedAllSignatures") !== true
      ) {
        return null;
      }

      const audit = agreement.evidence.find(
        (item) =>
          item.evidenceType === INSTRUMENT_EVIDENCE_TYPE.EXTERNAL_RECORD &&
          item.subjectType === INSTRUMENT_EVIDENCE_SUBJECT.EXECUTION &&
          validEvidenceLocation(item) &&
          metadataField(item.metadata, "adobeAgreementId") === agreementId &&
          typeof metadataField(item.metadata, "signerEmail") === "string" &&
          (metadataField(item.metadata, "signerEmail") as string)
            .trim()
            .toLowerCase() === intake.candidateEmail.trim().toLowerCase() &&
          metadataField(item.metadata, "operatorConfirmedAllSignatures") === true,
      );

      return audit ? { proof, audit, agreementId } : null;
    })
    .find((pair) => pair !== null);

  if (!matchedPair) {
    throw new Error("[ARP_MASTER_AGREEMENT_AUDIT_EVIDENCE_REQUIRED]");
  }

  const { proof, audit, agreementId } = matchedPair;

  if (intake.masterAgreementInstrumentId === agreement.id) {
    return {
      intakeId,
      participantId: intake.admittedParticipantId,
      instrumentId: agreement.id,
      bound: false,
    } as const;
  }

  if (intake.masterAgreementInstrumentId) {
    throw new Error("[ARP_MASTER_AGREEMENT_ALREADY_BOUND]");
  }

  const occurredAt = params.occurredAt ?? new Date();
  if (!Number.isFinite(occurredAt.getTime())) {
    throw new Error("[ARP_MASTER_AGREEMENT_BINDING_TIME_INVALID]");
  }

  const updated = await params.client.representativeOnboardingIntake.updateMany({
    where: {
      id: intakeId,
      status: REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED,
      admittedParticipantId: intake.admittedParticipantId,
      masterAgreementInstrumentId: null,
    },
    data: { masterAgreementInstrumentId: agreement.id },
  });

  if (updated.count !== 1) {
    throw new Error("[ARP_MASTER_AGREEMENT_BINDING_CONCURRENT_CHANGE]");
  }

  await params.client.domainEvent.create({
    data: {
      streamType: "REPRESENTATIVE_PROGRAM_PARTICIPANT",
      streamId: intake.admittedParticipantId,
      eventType: "REPRESENTATIVE_MASTER_AGREEMENT_BOUND",
      payload: {
        intakeId,
        participantId: intake.admittedParticipantId,
        instrumentId: agreement.id,
        executionEvidenceId: proof.id,
        auditEvidenceId: audit.id,
        adobeAgreementId: agreementId,
      },
      metadata: {
        actorUserId,
        source: "representative-program.master-agreement-binding",
      },
      occurredAt,
    },
  });

  return {
    intakeId,
    participantId: intake.admittedParticipantId,
    instrumentId: agreement.id,
    bound: true,
  } as const;
}

export async function bindRepresentativeMasterAgreement(params: {
  client: RepresentativeMasterAgreementBindingRunner;
  intakeId: string;
  instrumentReference: string;
  actorUserId: string;
  occurredAt?: Date;
}) {
  return params.client.$transaction((tx) =>
    bindRepresentativeMasterAgreementWithClient({
      ...params,
      client: tx,
    }),
  );
}
