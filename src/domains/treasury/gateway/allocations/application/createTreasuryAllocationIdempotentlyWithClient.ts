import { createHash } from "node:crypto";

import type { TransactionClient } from "@prisma/client";

import { loadTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/loadTreasuryGatewayCommandReceiptWithClient";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import type { TreasuryGatewayCommandReceipt } from "../../commands/persistence/contracts";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TreasuryAllocation } from "../contracts";

import { loadTreasuryAllocationWithClient } from "../persistence/loadTreasuryAllocationWithClient";

import type { CreateTreasuryAllocationDurably } from "./createTreasuryAllocationDurablyContracts";

import { createTreasuryAllocationDurablyWithClient } from "./createTreasuryAllocationDurablyWithClient";

const CREATE_TREASURY_ALLOCATION_COMMAND_KIND =
  "CREATE_TREASURY_ALLOCATION";

export type IdempotentTreasuryAllocationCreationDisposition =
  | "CREATED"
  | "REPLAYED";

export type IdempotentTreasuryAllocationCreationResult = Readonly<{
  aggregate: TreasuryAllocation;

  receipt: TreasuryGatewayCommandReceipt;

  disposition: IdempotentTreasuryAllocationCreationDisposition;
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

function fingerprintTreasuryAllocationRequest(
  request: CreateTreasuryAllocationDurably,
): string {
  const materialRequest = {
    actorId: request.context.actorId,

    reference: request.reference,

    payload: request.payload,
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalize(materialRequest)))
    .digest("hex");
}

export async function createTreasuryAllocationIdempotentlyWithClient(params: {
  request: CreateTreasuryAllocationDurably;

  client: TransactionClient;
}): Promise<IdempotentTreasuryAllocationCreationResult> {
  const { request, client } = params;

  const requestFingerprint = fingerprintTreasuryAllocationRequest(request);

  const existingReceipt = await loadTreasuryGatewayCommandReceiptWithClient({
    idempotencyKey: request.context.idempotencyKey,

    client,
  });

  if (existingReceipt) {
    if (
      existingReceipt.commandKind !==
      CREATE_TREASURY_ALLOCATION_COMMAND_KIND
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
      TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_AGGREGATE_TYPE_INVALID] ${existingReceipt.aggregateType}`,
      );
    }

    const loaded = await loadTreasuryAllocationWithClient({
      allocationId: existingReceipt.aggregateId,

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

  const created = await createTreasuryAllocationDurablyWithClient({
    request,

    client,
  });

  const receipt = await persistTreasuryGatewayCommandReceiptWithClient({
    receipt: {
      idempotencyKey: request.context.idempotencyKey,

      commandId: request.context.commandId,

      commandKind: CREATE_TREASURY_ALLOCATION_COMMAND_KIND,

      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

      aggregateId: created.aggregate.id,

      actorId: request.context.actorId,

      correlationId: request.context.correlationId,

      requestFingerprint,
    },

    client,
  });

  return {
    aggregate: created.aggregate,

    receipt,

    disposition: "CREATED",
  };
}
