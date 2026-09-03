import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { AdmitProgramCapitalReceiptEvidence } from "./commands";

import type { ProgramCapitalReceipt } from "./contracts";

import type { CapitalReceiptEvidenceAdmittedPayload } from "./events";

import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "./status";

export function admitProgramCapitalReceiptEvidence(
  aggregate: ProgramCapitalReceipt,
  command: AdmitProgramCapitalReceiptEvidence,
): TreasuryDomainResult<
  ProgramCapitalReceipt,
  CapitalReceiptEvidenceAdmittedPayload
> {
  if (command.payload.receiptId !== aggregate.id) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_COMMAND_TARGET_MISMATCH] ${command.payload.receiptId} -> ${aggregate.id}`,
    );
  }

  if (aggregate.status !== PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_EVIDENCE_ADMISSION_INVALID] ${aggregate.status}`,
    );
  }
  if (command.payload.evidenceId.trim().length === 0) {
    throw new Error("[PROGRAM_CAPITAL_RECEIPT_EVIDENCE_ID_INVALID]");
  }

  if (command.payload.artifactId.trim().length === 0) {
    throw new Error("[PROGRAM_CAPITAL_RECEIPT_EVIDENCE_ARTIFACT_ID_INVALID]");
  }

  if (
    command.payload.externalReference !== undefined &&
    command.payload.externalReference.trim().length === 0
  ) {
    throw new Error(
      "[PROGRAM_CAPITAL_RECEIPT_EVIDENCE_EXTERNAL_REFERENCE_INVALID]",
    );
  }

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EVIDENCE_ADMITTED,

      payload: {
        receiptId: aggregate.id,

        evidenceId: command.payload.evidenceId,

        evidenceType: command.payload.evidenceType,

        artifactId: command.payload.artifactId,

        externalReference: command.payload.externalReference,

        submittedByActorId: command.context.actorId,

        recordedAt: command.payload.recordedAt,
      },

      occurredAt: command.payload.recordedAt,
    },
  };
}
