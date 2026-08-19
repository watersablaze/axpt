import { createHash } from "node:crypto";

import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { loadTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/loadTreasuryGatewayCommandReceiptWithClient";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import type { TreasuryGatewayCommandReceipt } from "../../commands/persistence/contracts";

import type { TreasuryTransfer } from "../contracts";

import { loadTreasuryTransferWithClient } from "../persistence/loadTreasuryTransferWithClient";

import type { OriginateTreasuryTransferDurably } from "./originateTreasuryTransferDurablyContracts";

import { originateTreasuryTransferDurablyWithClient } from "./originateTreasuryTransferDurablyWithClient";

const ORIGINATE_TREASURY_TRANSFER_COMMAND_KIND = "ORIGINATE_TREASURY_TRANSFER";

export type IdempotentTreasuryTransferOriginationDisposition =
  | "CREATED"
  | "REPLAYED";

export type IdempotentTreasuryTransferOriginationResult = Readonly<{
  aggregate: TreasuryTransfer;

  receipt: TreasuryGatewayCommandReceipt;

  disposition: IdempotentTreasuryTransferOriginationDisposition;
}>;

function canonicalize(value: unknown): unknown {
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

function fingerprintOriginationRequest(
  request: OriginateTreasuryTransferDurably,
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

export async function originateTreasuryTransferIdempotentlyWithClient(params: {
  request: OriginateTreasuryTransferDurably;

  client: TransactionClient;
}): Promise<IdempotentTreasuryTransferOriginationResult> {
  const { request, client } = params;

  const requestFingerprint = fingerprintOriginationRequest(request);

  const existingReceipt = await loadTreasuryGatewayCommandReceiptWithClient({
    idempotencyKey: request.context.idempotencyKey,

    client,
  });

  if (existingReceipt) {
    if (
      existingReceipt.commandKind !== ORIGINATE_TREASURY_TRANSFER_COMMAND_KIND
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
      TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_AGGREGATE_TYPE_INVALID] ${existingReceipt.aggregateType}`,
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

  const originated = await originateTreasuryTransferDurablyWithClient({
    request,

    client,
  });

  const receipt = await persistTreasuryGatewayCommandReceiptWithClient({
    receipt: {
      idempotencyKey: request.context.idempotencyKey,

      commandId: request.context.commandId,

      commandKind: ORIGINATE_TREASURY_TRANSFER_COMMAND_KIND,

      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

      aggregateId: originated.aggregate.id,

      actorId: request.context.actorId,

      correlationId: request.context.correlationId,

      requestFingerprint,
    },

    client,
  });

  return {
    aggregate: originated.aggregate,

    receipt,

    disposition: "CREATED",
  };
}
