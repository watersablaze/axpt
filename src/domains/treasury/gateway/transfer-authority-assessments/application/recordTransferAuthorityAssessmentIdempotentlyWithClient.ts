import { createHash } from "node:crypto";

import type { TransactionClient } from "@prisma/client";

import { loadTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/loadTreasuryGatewayCommandReceiptWithClient";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import type { TreasuryGatewayCommandReceipt } from "../../commands/persistence/contracts";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TransferAuthorityAssessment } from "../contracts";

import { loadTransferAuthorityAssessmentWithClient } from "../persistence/loadTransferAuthorityAssessmentWithClient";

import type { RecordTransferAuthorityAssessmentDurably } from "./recordTransferAuthorityAssessmentDurablyContracts";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "./recordTransferAuthorityAssessmentDurablyWithClient";

const RECORD_TRANSFER_AUTHORITY_ASSESSMENT_COMMAND_KIND =
  "RECORD_TRANSFER_AUTHORITY_ASSESSMENT";

export type IdempotentTransferAuthorityAssessmentRecordingDisposition =
  | "RECORDED"
  | "REPLAYED";

export type IdempotentTransferAuthorityAssessmentRecordingResult = Readonly<{
  aggregate: TransferAuthorityAssessment;

  receipt: TreasuryGatewayCommandReceipt;

  disposition: IdempotentTransferAuthorityAssessmentRecordingDisposition;
}>;

function canonicalize(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, canonicalize(nestedValue)]),
    );
  }

  return value;
}

function fingerprintAssessmentRequest(
  request: RecordTransferAuthorityAssessmentDurably,
): string {
  const materialRequest = {
    actorId: request.context.actorId,

    payload: request.payload,
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalize(materialRequest)))
    .digest("hex");
}

export async function recordTransferAuthorityAssessmentIdempotentlyWithClient(params: {
  request: RecordTransferAuthorityAssessmentDurably;

  client: TransactionClient;
}): Promise<IdempotentTransferAuthorityAssessmentRecordingResult> {
  const { request, client } = params;

  const requestFingerprint = fingerprintAssessmentRequest(request);

  const existingReceipt = await loadTreasuryGatewayCommandReceiptWithClient({
    idempotencyKey: request.context.idempotencyKey,

    client,
  });

  if (existingReceipt) {
    if (
      existingReceipt.commandKind !==
      RECORD_TRANSFER_AUTHORITY_ASSESSMENT_COMMAND_KIND
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_KIND_COLLISION] ${request.context.idempotencyKey}`,
      );
    }

    if (existingReceipt.requestFingerprint !== requestFingerprint) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION] ${request.context.idempotencyKey}`,
      );
    }

    if (
      existingReceipt.aggregateType !==
      TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_AGGREGATE_TYPE_INVALID] ${existingReceipt.aggregateType}`,
      );
    }

    const loaded = await loadTransferAuthorityAssessmentWithClient({
      assessmentId: existingReceipt.aggregateId,

      client,
    });

    if (!loaded) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_NOT_FOUND] ${existingReceipt.aggregateId}`,
      );
    }

    return {
      aggregate: loaded.aggregate,

      receipt: existingReceipt,

      disposition: "REPLAYED",
    };
  }

  const recorded = await recordTransferAuthorityAssessmentDurablyWithClient({
    request,

    client,
  });

  const receipt = await persistTreasuryGatewayCommandReceiptWithClient({
    receipt: {
      idempotencyKey: request.context.idempotencyKey,

      commandId: request.context.commandId,

      commandKind: RECORD_TRANSFER_AUTHORITY_ASSESSMENT_COMMAND_KIND,

      aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

      aggregateId: recorded.aggregate.id,

      actorId: request.context.actorId,

      correlationId: request.context.correlationId,

      requestFingerprint,
    },

    client,
  });

  return {
    aggregate: recorded.aggregate,

    receipt,

    disposition: "RECORDED",
  };
}
