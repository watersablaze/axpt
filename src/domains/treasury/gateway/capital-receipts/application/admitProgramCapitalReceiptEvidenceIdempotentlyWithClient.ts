import {
  createHash,
} from "node:crypto";

import type {
  TransactionClient,
} from "@prisma/client";

import {
  loadTreasuryGatewayCommandReceiptWithClient,
} from "../../commands/persistence/loadTreasuryGatewayCommandReceiptWithClient";

import {
  persistTreasuryGatewayCommandReceiptWithClient,
} from "../../commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import type {
  TreasuryGatewayCommandReceipt,
} from "../../commands/persistence/contracts";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../events/aggregateTypes";

import type {
  TreasuryCommandContext,
} from "../../shared/commandContext";

import type {
  ArtifactId,
  ProgramCapitalReceiptId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type {
  CapitalReceiptEvidenceType,
  ProgramCapitalReceipt,
} from "../contracts";

import {
  loadProgramCapitalReceiptWithClient,
} from "../persistence/loadProgramCapitalReceiptWithClient";

import {
  admitProgramCapitalReceiptEvidenceDurablyWithClient,
} from "./admitProgramCapitalReceiptEvidenceDurablyWithClient";

const ADMIT_PROGRAM_CAPITAL_RECEIPT_EVIDENCE_COMMAND_KIND =
  "ADMIT_PROGRAM_CAPITAL_RECEIPT_EVIDENCE";

export type IdempotentProgramCapitalReceiptEvidenceAdmissionDisposition =
  | "ADMITTED"
  | "REPLAYED";

export type IdempotentProgramCapitalReceiptEvidenceAdmissionResult =
  Readonly<{
    aggregate:
      ProgramCapitalReceipt;

    receipt:
      TreasuryGatewayCommandReceipt;

    disposition:
      IdempotentProgramCapitalReceiptEvidenceAdmissionDisposition;
  }>;

function fingerprintProgramCapitalReceiptEvidenceAdmission(
  params: {
    receiptId:
      ProgramCapitalReceiptId;

    evidenceId:
      string;

    evidenceType:
      CapitalReceiptEvidenceType;

    artifactId:
      ArtifactId;

    externalReference?:
      string;

    recordedAt:
      Date;

    actorId:
      string;
  },
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify({
        actorId:
          params.actorId,

        receiptId:
          params.receiptId,

        evidenceId:
          params.evidenceId,

        evidenceType:
          params.evidenceType,

        artifactId:
          params.artifactId,

        externalReference:
          params.externalReference ?? null,

        recordedAt:
          params.recordedAt.toISOString(),
      }),
    )
    .digest(
      "hex",
    );
}

export async function admitProgramCapitalReceiptEvidenceIdempotentlyWithClient(
  params: {
    receiptId:
      ProgramCapitalReceiptId;

    evidenceId:
      string;

    evidenceType:
      CapitalReceiptEvidenceType;

    artifactId:
      ArtifactId;

    externalReference?:
      string;

    recordedAt:
      Date;

    eventId:
      TreasuryEventId;

    context:
      TreasuryCommandContext;

    client:
      TransactionClient;
  },
): Promise<IdempotentProgramCapitalReceiptEvidenceAdmissionResult> {
  const {
    receiptId,
    evidenceId,
    evidenceType,
    artifactId,
    externalReference,
    recordedAt,
    eventId,
    context,
    client,
  } =
    params;

  const requestFingerprint =
    fingerprintProgramCapitalReceiptEvidenceAdmission({
      receiptId,

      evidenceId,

      evidenceType,

      artifactId,

      externalReference,

      recordedAt,

      actorId:
        context.actorId,
    });

  const existingReceipt =
    await loadTreasuryGatewayCommandReceiptWithClient({
      idempotencyKey:
        context.idempotencyKey,

      client,
    });

  if (
    existingReceipt
  ) {
    if (
      existingReceipt.commandKind !==
      ADMIT_PROGRAM_CAPITAL_RECEIPT_EVIDENCE_COMMAND_KIND
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_KIND_COLLISION] ${context.idempotencyKey}`,
      );
    }

    if (
      existingReceipt.requestFingerprint !==
      requestFingerprint
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION] ${context.idempotencyKey}`,
      );
    }

    if (
      existingReceipt.aggregateType !==
      TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_AGGREGATE_TYPE_INVALID] ${existingReceipt.aggregateType}`,
      );
    }

    if (
      existingReceipt.aggregateId !==
      receiptId
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_MISMATCH] ${existingReceipt.aggregateId} -> ${receiptId}`,
      );
    }

    const loaded =
      await loadProgramCapitalReceiptWithClient({
        receiptId,

        client,
      });

    if (
      !loaded
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_NOT_FOUND] ${receiptId}`,
      );
    }

    return {
      aggregate:
        loaded.aggregate,

      receipt:
        existingReceipt,

      disposition:
        "REPLAYED",
    };
  }

  const admitted =
    await admitProgramCapitalReceiptEvidenceDurablyWithClient({
      receiptId,

      evidenceId,

      evidenceType,

      artifactId,

      externalReference,

      recordedAt,

      eventId,

      context,

      client,
    });

  const receipt =
    await persistTreasuryGatewayCommandReceiptWithClient({
      receipt: {
        idempotencyKey:
          context.idempotencyKey,

        commandId:
          context.commandId,

        commandKind:
          ADMIT_PROGRAM_CAPITAL_RECEIPT_EVIDENCE_COMMAND_KIND,

        aggregateType:
          TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId:
          admitted.aggregate.id,

        actorId:
          context.actorId,

        correlationId:
          context.correlationId,

        requestFingerprint,
      },

      client,
    });

  return {
    aggregate:
      admitted.aggregate,

    receipt,

    disposition:
      "ADMITTED",
  };
}
