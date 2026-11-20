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
  TreasuryMoney,
} from "../../shared/money";

import type {
  ProgramCapitalReceipt,
} from "../contracts";

import {
  loadProgramCapitalReceiptWithClient,
} from "../persistence/loadProgramCapitalReceiptWithClient";

import {
  verifyProgramCapitalReceiptDurablyWithClient,
} from "./verifyProgramCapitalReceiptDurablyWithClient";

const VERIFY_PROGRAM_CAPITAL_RECEIPT_COMMAND_KIND =
  "VERIFY_PROGRAM_CAPITAL_RECEIPT";

export type IdempotentProgramCapitalReceiptVerificationDisposition =
  | "VERIFIED"
  | "REPLAYED";

export type IdempotentProgramCapitalReceiptVerificationResult =
  Readonly<{
    aggregate:
      ProgramCapitalReceipt;

    receipt:
      TreasuryGatewayCommandReceipt;

    disposition:
      IdempotentProgramCapitalReceiptVerificationDisposition;
  }>;

function canonicalizeEvidenceIds(
  evidenceIds:
    readonly string[],
): readonly string[] {
  return [
    ...evidenceIds,
  ].sort(
    (
      left,
      right,
    ) =>
      left.localeCompare(
        right,
      ),
  );
}

function fingerprintProgramCapitalReceiptVerification(
  params: {
    receiptId:
      ProgramCapitalReceiptId;

    verifiedAmount:
      TreasuryMoney;

    evidenceIds:
      readonly string[];

    verifiedAt:
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

        verifiedAmount: {
          amount:
            params.verifiedAmount.amount,

          currency:
            params.verifiedAmount.currency,
        },

        evidenceIds:
          canonicalizeEvidenceIds(
            params.evidenceIds,
          ),

        verifiedAt:
          params.verifiedAt.toISOString(),
      }),
    )
    .digest(
      "hex",
    );
}

export async function verifyProgramCapitalReceiptIdempotentlyWithClient(
  params: {
    receiptId:
      ProgramCapitalReceiptId;

    verifiedAmount:
      TreasuryMoney;

    evidenceIds:
      string[];

    verifiedAt:
      Date;

    eventId:
      TreasuryEventId;

    context:
      TreasuryCommandContext;

    client:
      TransactionClient;
  },
): Promise<IdempotentProgramCapitalReceiptVerificationResult> {
  const {
    receiptId,
    verifiedAmount,
    evidenceIds,
    verifiedAt,
    eventId,
    context,
    client,
  } =
    params;

  const requestFingerprint =
    fingerprintProgramCapitalReceiptVerification({
      receiptId,

      verifiedAmount,

      evidenceIds,

      verifiedAt,

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
      VERIFY_PROGRAM_CAPITAL_RECEIPT_COMMAND_KIND
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

  const verified =
    await verifyProgramCapitalReceiptDurablyWithClient({
      command: {
        context,

        payload: {
          receiptId,

          verifiedAmount,

          evidenceIds,

          verifiedAt,
        },
      },

      eventId,

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
          VERIFY_PROGRAM_CAPITAL_RECEIPT_COMMAND_KIND,

        aggregateType:
          TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId:
          verified.aggregate.id,

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
      verified.aggregate,

    receipt,

    disposition:
      "VERIFIED",
  };
}
