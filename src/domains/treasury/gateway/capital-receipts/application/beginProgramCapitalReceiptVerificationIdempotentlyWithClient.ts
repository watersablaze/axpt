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
  ProgramCapitalReceiptId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type {
  ProgramCapitalReceipt,
} from "../contracts";

import {
  loadProgramCapitalReceiptWithClient,
} from "../persistence/loadProgramCapitalReceiptWithClient";

import {
  beginProgramCapitalReceiptVerificationDurablyWithClient,
} from "./beginProgramCapitalReceiptVerificationDurablyWithClient";

const BEGIN_PROGRAM_CAPITAL_RECEIPT_VERIFICATION_COMMAND_KIND =
  "BEGIN_PROGRAM_CAPITAL_RECEIPT_VERIFICATION";

export type IdempotentProgramCapitalReceiptVerificationStartDisposition =
  | "STARTED"
  | "REPLAYED";

export type IdempotentProgramCapitalReceiptVerificationStartResult =
  Readonly<{
    aggregate:
      ProgramCapitalReceipt;

    receipt:
      TreasuryGatewayCommandReceipt;

    disposition:
      IdempotentProgramCapitalReceiptVerificationStartDisposition;
  }>;

function fingerprintProgramCapitalReceiptVerificationStart(
  params: {
    receiptId:
      ProgramCapitalReceiptId;

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
      }),
    )
    .digest(
      "hex",
    );
}

export async function beginProgramCapitalReceiptVerificationIdempotentlyWithClient(
  params: {
    receiptId:
      ProgramCapitalReceiptId;

    eventId:
      TreasuryEventId;

    context:
      TreasuryCommandContext;

    client:
      TransactionClient;
  },
): Promise<IdempotentProgramCapitalReceiptVerificationStartResult> {
  const {
    receiptId,
    eventId,
    context,
    client,
  } =
    params;

  const requestFingerprint =
    fingerprintProgramCapitalReceiptVerificationStart({
      receiptId,

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
      BEGIN_PROGRAM_CAPITAL_RECEIPT_VERIFICATION_COMMAND_KIND
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

  const started =
    await beginProgramCapitalReceiptVerificationDurablyWithClient({
      receiptId,

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
          BEGIN_PROGRAM_CAPITAL_RECEIPT_VERIFICATION_COMMAND_KIND,

        aggregateType:
          TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId:
          started.aggregate.id,

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
      started.aggregate,

    receipt,

    disposition:
      "STARTED",
  };
}
