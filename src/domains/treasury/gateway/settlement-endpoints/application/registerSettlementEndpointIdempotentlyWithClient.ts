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
  SettlementEndpoint,
} from "../contracts";

import {
  loadSettlementEndpointWithClient,
} from "../persistence/loadSettlementEndpointWithClient";

import type {
  RegisterSettlementEndpointDurably,
} from "./registerSettlementEndpointDurablyContracts";

import {
  registerSettlementEndpointDurablyWithClient,
} from "./registerSettlementEndpointDurablyWithClient";

const REGISTER_SETTLEMENT_ENDPOINT_COMMAND_KIND =
  "REGISTER_SETTLEMENT_ENDPOINT";

export type IdempotentSettlementEndpointRegistrationDisposition =
  | "REGISTERED"
  | "REPLAYED";

export type IdempotentSettlementEndpointRegistrationResult =
  Readonly<{
    aggregate: SettlementEndpoint;

    receipt: TreasuryGatewayCommandReceipt;

    disposition:
      IdempotentSettlementEndpointRegistrationDisposition;
  }>;

function canonicalize(
  value: unknown,
): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<string, unknown>,
      )
        .sort(
          ([left], [right]) =>
            left.localeCompare(right),
        )
        .map(
          ([key, nestedValue]) => [
            key,
            canonicalize(nestedValue),
          ],
        ),
    );
  }

  return value;
}

function fingerprintRequest(
  request: RegisterSettlementEndpointDurably,
): string {
  const materialRequest = {
    actorId: request.context.actorId,

    reference: request.reference,

    payload: request.payload,
  };

  return createHash("sha256")
    .update(
      JSON.stringify(
        canonicalize(materialRequest),
      ),
    )
    .digest("hex");
}

export async function registerSettlementEndpointIdempotentlyWithClient(
  params: {
    request: RegisterSettlementEndpointDurably;

    client: TransactionClient;
  },
): Promise<IdempotentSettlementEndpointRegistrationResult> {
  const {
    request,
    client,
  } = params;

  const requestFingerprint =
    fingerprintRequest(request);

  const existingReceipt =
    await loadTreasuryGatewayCommandReceiptWithClient({
      idempotencyKey:
        request.context.idempotencyKey,

      client,
    });

  if (existingReceipt) {
    if (
      existingReceipt.commandKind !==
      REGISTER_SETTLEMENT_ENDPOINT_COMMAND_KIND
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_KIND_COLLISION] ${request.context.idempotencyKey}`,
      );
    }

    if (
      existingReceipt.requestFingerprint !==
      requestFingerprint
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION] ${request.context.idempotencyKey}`,
      );
    }

    if (
      existingReceipt.aggregateType !==
      TREASURY_AGGREGATE_TYPE.SETTLEMENT_ENDPOINT
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_COMMAND_RECEIPT_AGGREGATE_TYPE_INVALID] ${existingReceipt.aggregateType}`,
      );
    }

    const loaded =
      await loadSettlementEndpointWithClient({
        settlementEndpointId:
          existingReceipt.aggregateId,

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

  const created =
    await registerSettlementEndpointDurablyWithClient({
      request,

      client,
    });

  const receipt =
    await persistTreasuryGatewayCommandReceiptWithClient({
      receipt: {
        idempotencyKey:
          request.context.idempotencyKey,

        commandId:
          request.context.commandId,

        commandKind:
          REGISTER_SETTLEMENT_ENDPOINT_COMMAND_KIND,

        aggregateType:
          TREASURY_AGGREGATE_TYPE.SETTLEMENT_ENDPOINT,

        aggregateId:
          created.aggregate.id,

        actorId:
          request.context.actorId,

        correlationId:
          request.context.correlationId,

        requestFingerprint,
      },

      client,
    });

  return {
    aggregate: created.aggregate,

    receipt,

    disposition: "REGISTERED",
  };
}
