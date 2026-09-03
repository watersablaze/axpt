import { createHash } from "node:crypto";

import type { TransactionClient } from "@prisma/client";

import { loadTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/loadTreasuryGatewayCommandReceiptWithClient";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import type { TreasuryGatewayCommandReceipt } from "../../commands/persistence/contracts";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { ProgramCapitalReceipt } from "../contracts";

import { loadProgramCapitalReceiptWithClient } from "../persistence/loadProgramCapitalReceiptWithClient";

import type { ReportProgramCapitalReceiptDurably } from "./reportProgramCapitalReceiptDurablyContracts";

import { reportProgramCapitalReceiptDurablyWithClient } from "./reportProgramCapitalReceiptDurablyWithClient";

const REPORT_PROGRAM_CAPITAL_RECEIPT_COMMAND_KIND =
  "REPORT_PROGRAM_CAPITAL_RECEIPT";

export type IdempotentProgramCapitalReceiptReportingDisposition =
  | "REPORTED"
  | "REPLAYED";

export type IdempotentProgramCapitalReceiptReportingResult = Readonly<{
  aggregate: ProgramCapitalReceipt;

  receipt: TreasuryGatewayCommandReceipt;

  disposition: IdempotentProgramCapitalReceiptReportingDisposition;
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

function fingerprintProgramCapitalReceiptRequest(
  request: ReportProgramCapitalReceiptDurably,
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

export async function reportProgramCapitalReceiptIdempotentlyWithClient(params: {
  request: ReportProgramCapitalReceiptDurably;

  client: TransactionClient;
}): Promise<IdempotentProgramCapitalReceiptReportingResult> {
  const { request, client } = params;

  const requestFingerprint = fingerprintProgramCapitalReceiptRequest(request);

  const existingReceipt = await loadTreasuryGatewayCommandReceiptWithClient({
    idempotencyKey: request.context.idempotencyKey,

    client,
  });

  if (existingReceipt) {
    if (
      existingReceipt.commandKind !==
      REPORT_PROGRAM_CAPITAL_RECEIPT_COMMAND_KIND
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
      TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_AGGREGATE_TYPE_INVALID] ${existingReceipt.aggregateType}`,
      );
    }

    const loaded = await loadProgramCapitalReceiptWithClient({
      receiptId: existingReceipt.aggregateId,

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

  const reported = await reportProgramCapitalReceiptDurablyWithClient({
    request,

    client,
  });

  const receipt = await persistTreasuryGatewayCommandReceiptWithClient({
    receipt: {
      idempotencyKey: request.context.idempotencyKey,

      commandId: request.context.commandId,

      commandKind: REPORT_PROGRAM_CAPITAL_RECEIPT_COMMAND_KIND,

      aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

      aggregateId: reported.aggregate.id,

      actorId: request.context.actorId,

      correlationId: request.context.correlationId,

      requestFingerprint,
    },

    client,
  });

  return {
    aggregate: reported.aggregate,

    receipt,

    disposition: "REPORTED",
  };
}
