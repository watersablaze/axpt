import type { TransactionClient } from "@prisma/client";

import type { TreasuryGatewayCommandReceipt } from "./contracts";

type PrismaKnownRequestError = Readonly<{
  code: string;

  meta?: Readonly<{
    target?: unknown;
  }>;
}>;

function isPrismaKnownRequestError(
  error: unknown,
): error is PrismaKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}

function getUniqueTarget(error: PrismaKnownRequestError): readonly string[] {
  const target = error.meta?.target;

  return Array.isArray(target)
    ? target.filter((value): value is string => typeof value === "string")
    : [];
}

export async function persistTreasuryGatewayCommandReceiptWithClient(params: {
  receipt: Omit<TreasuryGatewayCommandReceipt, "createdAt">;

  client: TransactionClient;
}): Promise<TreasuryGatewayCommandReceipt> {
  const { receipt, client } = params;

  try {
    const persisted = await client.treasuryGatewayCommandReceipt.create({
      data: {
        idempotencyKey: receipt.idempotencyKey,

        commandId: receipt.commandId,

        commandKind: receipt.commandKind,

        aggregateType: receipt.aggregateType,

        aggregateId: receipt.aggregateId,

        actorId: receipt.actorId,

        correlationId: receipt.correlationId,

        requestFingerprint: receipt.requestFingerprint,
      },
    });

    return {
      idempotencyKey: persisted.idempotencyKey,

      commandId: persisted.commandId,

      commandKind: persisted.commandKind,

      aggregateType:
        persisted.aggregateType as TreasuryGatewayCommandReceipt["aggregateType"],

      aggregateId: persisted.aggregateId,

      actorId: persisted.actorId,

      correlationId: persisted.correlationId,

      requestFingerprint: persisted.requestFingerprint,

      createdAt: persisted.createdAt,
    };
  } catch (error: unknown) {
    if (isPrismaKnownRequestError(error) && error.code === "P2002") {
      const target = getUniqueTarget(error);

      if (target.includes("idempotencyKey")) {
        throw new Error(
          `[TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_CONFLICT] ${receipt.idempotencyKey}`,
        );
      }

      if (target.includes("commandId")) {
        throw new Error(
          `[TREASURY_GATEWAY_COMMAND_ID_CONFLICT] ${receipt.commandId}`,
        );
      }
    }

    throw error;
  }
}
