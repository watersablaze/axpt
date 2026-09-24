import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_EVIDENCE_SUBJECT,
  INSTRUMENT_EVIDENCE_TYPE,
  INSTRUMENT_VERSION_STATUS,
} from "../../../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../../../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../../../stream";
import { recordInstrumentEvidenceWithClient } from "../../../commands/recordInstrumentEvidenceWithClient";
import { transitionInstrumentStateWithClient } from "../../../commands/transitionInstrumentStateWithClient";
import {
  isMasterAgreementEvidenceReceipt,
  type MasterAgreementEvidenceReceipt,
} from "./assembleMasterAgreementEvidence";

type Client = Pick<
  PrismaClient,
  | "user"
  | "institutionalInstrument"
  | "instrumentVersion"
  | "instrumentEvidence"
  | "instrumentAuthority"
  | "instrumentStateTransition"
  | "domainEvent"
>;

type EvidenceView = Readonly<{
  evidenceType: string;
  subjectType: string;
  metadata: unknown;
  uri: string | null;
  contentHash: string | null;
}>;

type Runner = Pick<PrismaClient, "$transaction">;

function field(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

/**
 * Recognize an externally executed Acrobat agreement in one DB transaction.
 * This does not admit a candidate, appoint a representative, or grant authority.
 */
export async function recordMasterAgreementExecutionWithClient(params: {
  client: Client;
  receipt: MasterAgreementEvidenceReceipt;
}) {
  const { client, receipt } = params;

  if (!isMasterAgreementEvidenceReceipt(receipt)) {
    throw new Error("[ARP_MASTER_AGREEMENT_RECEIPT_REQUIRED]");
  }

  const completedAt = new Date(receipt.completedAt.getTime());
  const reviewedAt = new Date(receipt.reviewedAt.getTime());

  if (
    !Number.isFinite(completedAt.getTime()) ||
    !Number.isFinite(reviewedAt.getTime()) ||
    completedAt.getTime() > reviewedAt.getTime() ||
    !/^[a-f0-9]{64}$/.test(receipt.signedDocument.contentHash) ||
    !/^[a-f0-9]{64}$/.test(receipt.auditTrail.contentHash)
  ) {
    throw new Error("[ARP_MASTER_AGREEMENT_RECEIPT_INVALID]");
  }

  const reviewer = await client.user.findUnique({
    where: { id: receipt.reviewedByUserId },
    select: { isAdmin: true },
  });
  if (!reviewer?.isAdmin) {
    throw new Error("[ARP_MASTER_AGREEMENT_ADMIN_REQUIRED]");
  }

  const agreement = await client.institutionalInstrument.findUnique({
    where: { reference: receipt.reference },
    include: {
      versions: { where: { number: 1 } },
      evidence: true,
    },
  });

  if (
    !agreement ||
    agreement.kind !==
      INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_PROGRAM_AGREEMENT
  ) {
    throw new Error("[ARP_MASTER_AGREEMENT_INSTRUMENT_REQUIRED]");
  }

  const candidateDesignation = agreement.evidence.some(
    (item: EvidenceView) =>
      item.evidenceType === INSTRUMENT_EVIDENCE_TYPE.ATTESTATION &&
      item.subjectType === INSTRUMENT_EVIDENCE_SUBJECT.INSTRUMENT &&
      field(item.metadata, "candidateEmail") === receipt.signerEmail,
  );

  if (!candidateDesignation) {
    throw new Error("[ARP_MASTER_AGREEMENT_SIGNER_MISMATCH]");
  }

  const version = agreement.versions[0];
  if (!version) {
    throw new Error("[ARP_MASTER_AGREEMENT_VERSION_REQUIRED]");
  }

  const matches = (
    item: EvidenceView,
    evidenceType: string,
    uri: string,
    hash: string,
  ) =>
    item.evidenceType === evidenceType &&
    item.subjectType === INSTRUMENT_EVIDENCE_SUBJECT.EXECUTION &&
    item.uri === uri &&
    item.contentHash === hash &&
    field(item.metadata, "adobeAgreementId") === receipt.adobeAgreementId &&
    field(item.metadata, "signerEmail") === receipt.signerEmail;

  if (agreement.status === INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTED) {
    const documentPresent = agreement.evidence.some((item: EvidenceView) =>
      matches(
        item,
        INSTRUMENT_EVIDENCE_TYPE.DOCUMENT,
        receipt.signedDocument.uri,
        receipt.signedDocument.contentHash,
      ),
    );
    const auditPresent = agreement.evidence.some((item: EvidenceView) =>
      matches(
        item,
        INSTRUMENT_EVIDENCE_TYPE.EXTERNAL_RECORD,
        receipt.auditTrail.uri,
        receipt.auditTrail.contentHash,
      ),
    );

    if (
      version.status !== INSTRUMENT_VERSION_STATUS.ISSUED ||
      !documentPresent ||
      !auditPresent
    ) {
      throw new Error("[ARP_MASTER_AGREEMENT_EXECUTION_CONFLICT]");
    }

    return {
      instrumentId: agreement.id,
      reference: receipt.reference,
      executed: false,
    } as const;
  }

  if (
    agreement.status !== INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT ||
    version.status !== INSTRUMENT_VERSION_STATUS.DRAFT
  ) {
    throw new Error("[ARP_MASTER_AGREEMENT_EXECUTION_STATE_CONFLICT]");
  }

  const issued = await client.instrumentVersion.updateMany({
    where: {
      id: version.id,
      status: INSTRUMENT_VERSION_STATUS.DRAFT,
      issuedAt: null,
    },
    data: {
      status: INSTRUMENT_VERSION_STATUS.ISSUED,
      issuedAt: reviewedAt,
    },
  });

  if (issued.count !== 1) {
    throw new Error("[ARP_MASTER_AGREEMENT_VERSION_CONCURRENT_CHANGE]");
  }

  await client.domainEvent.create({
    data: {
      streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: agreement.id,
      eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_ISSUED,
      payload: {
        versionId: version.id,
        versionNumber: 1,
        issuedAt: reviewedAt.toISOString(),
      },
      metadata: {
        actorUserId: receipt.reviewedByUserId,
        source: "representative-program.master-agreement-execution",
      },
      occurredAt: reviewedAt,
    },
  });

  const evidenceMetadata = {
    adobeAgreementId: receipt.adobeAgreementId,
    signerEmail: receipt.signerEmail,
    completedAt: completedAt.toISOString(),
    reviewedAt: reviewedAt.toISOString(),
    reviewedByUserId: receipt.reviewedByUserId,
    operatorConfirmedAllSignatures: true,
  };

  await recordInstrumentEvidenceWithClient({
    client,
    instrumentReference: receipt.reference,
    evidenceType: INSTRUMENT_EVIDENCE_TYPE.DOCUMENT,
    subjectType: INSTRUMENT_EVIDENCE_SUBJECT.EXECUTION,
    title: "Externally executed Master Agreement",
    uri: receipt.signedDocument.uri,
    contentHash: receipt.signedDocument.contentHash,
    metadata: evidenceMetadata,
    recordedByUserId: receipt.reviewedByUserId,
    recordedAt: reviewedAt,
  });

  await recordInstrumentEvidenceWithClient({
    client,
    instrumentReference: receipt.reference,
    evidenceType: INSTRUMENT_EVIDENCE_TYPE.EXTERNAL_RECORD,
    subjectType: INSTRUMENT_EVIDENCE_SUBJECT.EXECUTION,
    title: "Acrobat execution audit trail",
    uri: receipt.auditTrail.uri,
    contentHash: receipt.auditTrail.contentHash,
    metadata: evidenceMetadata,
    recordedByUserId: receipt.reviewedByUserId,
    recordedAt: reviewedAt,
  });

  await transitionInstrumentStateWithClient({
    client,
    instrumentReference: receipt.reference,
    expectedFromStatus: INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT,
    toStatus: INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTION_PENDING,
    actorUserId: receipt.reviewedByUserId,
    reason: "Private execution evidence and Acrobat audit received",
    occurredAt: reviewedAt,
  });

  await transitionInstrumentStateWithClient({
    client,
    instrumentReference: receipt.reference,
    expectedFromStatus: INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTION_PENDING,
    toStatus: INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTED,
    actorUserId: receipt.reviewedByUserId,
    reason: "Operator reviewed completed Acrobat execution",
    metadata: { adobeAgreementId: receipt.adobeAgreementId },
    occurredAt: reviewedAt,
  });

  return {
    instrumentId: agreement.id,
    reference: receipt.reference,
    executed: true,
  } as const;
}

export async function recordMasterAgreementExecution(params: {
  client: Runner;
  receipt: MasterAgreementEvidenceReceipt;
}) {
  return params.client.$transaction((tx: Client) =>
    recordMasterAgreementExecutionWithClient({
      client: tx,
      receipt: params.receipt,
    }),
  );
}
