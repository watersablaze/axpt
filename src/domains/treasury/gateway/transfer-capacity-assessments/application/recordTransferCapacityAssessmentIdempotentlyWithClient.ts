import { createHash } from "node:crypto";

import type { TransactionClient } from "@prisma/client";

import { loadTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/loadTreasuryGatewayCommandReceiptWithClient";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import type { TreasuryGatewayCommandReceipt } from "../../commands/persistence/contracts";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import {
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
  type TransferCapacityAssessment,
} from "../contracts";

import { loadTransferCapacityAssessmentWithClient } from "../persistence/loadTransferCapacityAssessmentWithClient";

import type { RecordTransferCapacityAssessmentDurably } from "./recordTransferCapacityAssessmentDurablyContracts";

import { prepareCanonicalTransferCapacityAssessmentRequestWithClient } from "./prepareCanonicalTransferCapacityAssessmentRequestWithClient";

import { recordTransferCapacityAssessmentDurablyWithClient } from "./recordTransferCapacityAssessmentDurablyWithClient";

const RECORD_TRANSFER_CAPACITY_ASSESSMENT_COMMAND_KIND =
  "RECORD_TRANSFER_CAPACITY_ASSESSMENT";

export type IdempotentTransferCapacityAssessmentRecordingDisposition =
  | "RECORDED"
  | "REPLAYED";

export type IdempotentTransferCapacityAssessmentRecordingResult = Readonly<{
  aggregate: TransferCapacityAssessment;

  receipt: TreasuryGatewayCommandReceipt;

  disposition: IdempotentTransferCapacityAssessmentRecordingDisposition;
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
  request: RecordTransferCapacityAssessmentDurably,
): string {
  /*
   * Generated transport identities are deliberately excluded.
   *
   * SOURCE_FUNDS is also excluded from caller request identity.
   * It is no longer a caller-authored Treasury assertion; the
   * Gateway derives it from authoritative Available Capital when
   * a new Capacity Assessment is recorded.
   *
   * This preserves historical idempotency:
   *
   * - changing an invented SOURCE_FUNDS value does not create a
   *   materially different request;
   * - a later change in Available Capital does not invalidate an
   *   exact retry of an already-recorded assessment;
   * - caller-owned constraints remain material.
   */
  const materialConstraints =
    request.payload.constraints.filter(
      (constraint) =>
        constraint.type !==
        TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,
    );

  const materialRequest = {
    actorId: request.context.actorId,

    payload: {
      ...request.payload,

      constraints: materialConstraints,
    },
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalize(materialRequest)))
    .digest("hex");
}

export async function recordTransferCapacityAssessmentIdempotentlyWithClient(params: {
  request: RecordTransferCapacityAssessmentDurably;

  client: TransactionClient;
}): Promise<IdempotentTransferCapacityAssessmentRecordingResult> {
  const { request, client } = params;

  const requestFingerprint =
    fingerprintAssessmentRequest(request);

  const existingReceipt = await loadTreasuryGatewayCommandReceiptWithClient({
    idempotencyKey: request.context.idempotencyKey,

    client,
  });

  if (existingReceipt) {
    if (
      existingReceipt.commandKind !==
      RECORD_TRANSFER_CAPACITY_ASSESSMENT_COMMAND_KIND
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
      TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_AGGREGATE_TYPE_INVALID] ${existingReceipt.aggregateType}`,
      );
    }

    const loaded = await loadTransferCapacityAssessmentWithClient({
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

  const canonicalRequest =
    await prepareCanonicalTransferCapacityAssessmentRequestWithClient({
      request,

      client,
    });

  const recorded = await recordTransferCapacityAssessmentDurablyWithClient({
    request: canonicalRequest,

    client,
  });

  const receipt = await persistTreasuryGatewayCommandReceiptWithClient({
    receipt: {
      idempotencyKey: request.context.idempotencyKey,

      commandId: request.context.commandId,

      commandKind: RECORD_TRANSFER_CAPACITY_ASSESSMENT_COMMAND_KIND,

      aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

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
