import { createHash } from "node:crypto";

import type { TransactionClient } from "@prisma/client";

import { loadTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/loadTreasuryGatewayCommandReceiptWithClient";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import type { TreasuryGatewayCommandReceipt } from "../../commands/persistence/contracts";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import type { TreasuryTransfer } from "../contracts";

import { loadTreasuryTransferWithClient } from "../persistence/loadTreasuryTransferWithClient";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "./beginTreasuryTransferAuthorityReviewDurablyWithClient";

const BEGIN_TREASURY_TRANSFER_AUTHORITY_REVIEW_COMMAND_KIND =
  "BEGIN_TREASURY_TRANSFER_AUTHORITY_REVIEW";

export type IdempotentTreasuryTransferAuthorityReviewDisposition =
  | "STARTED"
  | "REPLAYED";

export type IdempotentTreasuryTransferAuthorityReviewResult = Readonly<{
  aggregate: TreasuryTransfer;

  receipt: TreasuryGatewayCommandReceipt;

  disposition: IdempotentTreasuryTransferAuthorityReviewDisposition;
}>;

function fingerprintAuthorityReviewRequest(params: {
  transferId: TreasuryTransferId;

  actorId: string;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        actorId: params.actorId,

        transferId: params.transferId,
      }),
    )
    .digest("hex");
}

export async function beginTreasuryTransferAuthorityReviewIdempotentlyWithClient(params: {
  transferId: TreasuryTransferId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<IdempotentTreasuryTransferAuthorityReviewResult> {
  const { transferId, eventId, context, client } = params;

  const requestFingerprint = fingerprintAuthorityReviewRequest({
    transferId,

    actorId: context.actorId,
  });

  const existingReceipt = await loadTreasuryGatewayCommandReceiptWithClient({
    idempotencyKey: context.idempotencyKey,

    client,
  });

  if (existingReceipt) {
    if (
      existingReceipt.commandKind !==
      BEGIN_TREASURY_TRANSFER_AUTHORITY_REVIEW_COMMAND_KIND
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
      transferId,

      client,
    });

    if (!loaded) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_NOT_FOUND] ${transferId}`,
      );
    }

    return {
      aggregate: loaded.aggregate,

      receipt: existingReceipt,

      disposition: "REPLAYED",
    };
  }

  const reviewed = await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId,

    context,

    client,
  });

  const receipt = await persistTreasuryGatewayCommandReceiptWithClient({
    receipt: {
      idempotencyKey: context.idempotencyKey,

      commandId: context.commandId,

      commandKind: BEGIN_TREASURY_TRANSFER_AUTHORITY_REVIEW_COMMAND_KIND,

      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

      aggregateId: reviewed.aggregate.id,

      actorId: context.actorId,

      correlationId: context.correlationId,

      requestFingerprint,
    },

    client,
  });

  return {
    aggregate: reviewed.aggregate,

    receipt,

    disposition: "STARTED",
  };
}
