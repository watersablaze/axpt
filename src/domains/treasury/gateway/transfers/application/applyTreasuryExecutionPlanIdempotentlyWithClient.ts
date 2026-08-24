import { createHash } from "node:crypto";

import type { TransactionClient } from "@prisma/client";

import { loadTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/loadTreasuryGatewayCommandReceiptWithClient";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import type { TreasuryGatewayCommandReceipt } from "../../commands/persistence/contracts";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryExecutionPlanId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import type { TreasuryTransfer } from "../contracts";

import { loadTreasuryTransferWithClient } from "../persistence/loadTreasuryTransferWithClient";

import { applyTreasuryExecutionPlanDurablyWithClient } from "./applyTreasuryExecutionPlanDurablyWithClient";

const APPLY_TREASURY_EXECUTION_PLAN_COMMAND_KIND =
  "APPLY_TREASURY_EXECUTION_PLAN";

export type IdempotentTreasuryExecutionPlanApplicationDisposition =
  | "APPLIED"
  | "REPLAYED";

export type IdempotentTreasuryExecutionPlanApplicationResult = Readonly<{
  aggregate: TreasuryTransfer;

  receipt: TreasuryGatewayCommandReceipt;

  disposition: IdempotentTreasuryExecutionPlanApplicationDisposition;
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

function fingerprintApplicationRequest(params: {
  transferId: TreasuryTransferId;

  planId: TreasuryExecutionPlanId;

  context: TreasuryCommandContext;
}): string {
  const materialRequest = {
    actorId: params.context.actorId,

    transferId: params.transferId,

    planId: params.planId,
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalize(materialRequest)))
    .digest("hex");
}

export async function applyTreasuryExecutionPlanIdempotentlyWithClient(params: {
  transferId: TreasuryTransferId;

  planId: TreasuryExecutionPlanId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<IdempotentTreasuryExecutionPlanApplicationResult> {
  const { transferId, planId, eventId, context, client } = params;

  const requestFingerprint = fingerprintApplicationRequest({
    transferId,

    planId,

    context,
  });

  const existingReceipt = await loadTreasuryGatewayCommandReceiptWithClient({
    idempotencyKey: context.idempotencyKey,

    client,
  });

  if (existingReceipt) {
    if (
      existingReceipt.commandKind !== APPLY_TREASURY_EXECUTION_PLAN_COMMAND_KIND
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_KIND_COLLISION] ${context.idempotencyKey}`,
      );
    }

    if (existingReceipt.requestFingerprint !== requestFingerprint) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION] ${context.idempotencyKey}`,
      );
    }

    if (
      existingReceipt.aggregateType !==
      TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_AGGREGATE_TYPE_INVALID] ${existingReceipt.aggregateType}`,
      );
    }

    if (existingReceipt.aggregateId !== transferId) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_MISMATCH] ${existingReceipt.aggregateId} -> ${transferId}`,
      );
    }

    const loaded = await loadTreasuryTransferWithClient({
      transferId: existingReceipt.aggregateId,

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

  const applied = await applyTreasuryExecutionPlanDurablyWithClient({
    transferId,

    planId,

    eventId,

    context,

    client,
  });

  const receipt = await persistTreasuryGatewayCommandReceiptWithClient({
    receipt: {
      idempotencyKey: context.idempotencyKey,

      commandId: context.commandId,

      commandKind: APPLY_TREASURY_EXECUTION_PLAN_COMMAND_KIND,

      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

      aggregateId: applied.aggregate.id,

      actorId: context.actorId,

      correlationId: context.correlationId,

      requestFingerprint,
    },

    client,
  });

  return {
    aggregate: applied.aggregate,

    receipt,

    disposition: "APPLIED",
  };
}
