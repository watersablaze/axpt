import {
  randomUUID,
} from "node:crypto";

import type {
  PrismaClient,
  TransactionClient,
} from "@prisma/client";

import type {
  Principal,
} from "../../auth/types";

import {
  beginProgramCapitalReceiptVerificationIdempotentlyWithClient,
} from "../../treasury/gateway/capital-receipts/application/beginProgramCapitalReceiptVerificationIdempotentlyWithClient";

export type BeginProgramCapitalReceiptVerificationHttpResult =
  | Readonly<{
      status:
        200;

      body:
        Readonly<{
          ok:
            true;

          disposition:
            "STARTED" | "REPLAYED";

          receipt:
            Readonly<{
              id:
                string;

              reference:
                string;

              status:
                string;

              version:
                number;

              programId:
                string;

              destinationProgramAccountId:
                string;

              updatedAt:
                string;
            }>;
        }>;
    }>
  | Readonly<{
      status:
        400 | 404 | 409;

      body:
        Readonly<{
          ok:
            false;

          error:
            string;
        }>;
    }>;

type IdentityFactory =
  () => string;

function isErrorCode(
  error:
    unknown,

  code:
    string,
): boolean {
  return (
    error instanceof Error &&
    error.message.includes(
      code,
    )
  );
}

export async function beginProgramCapitalReceiptVerificationHttp(
  params: {
    rawReceiptId:
      string;

    request:
      Request;

    principal:
      Principal;

    prisma:
      PrismaClient;

    generateIdentity?:
      IdentityFactory;

    now?:
      () => Date;
  },
): Promise<
  BeginProgramCapitalReceiptVerificationHttpResult
> {
  const {
    rawReceiptId,
    request,
    principal,
    prisma,
    generateIdentity =
      randomUUID,
    now =
      () => new Date(),
  } =
    params;

  const receiptId =
    rawReceiptId.trim();

  if (
    receiptId.length ===
    0
  ) {
    return {
      status:
        400,

      body: {
        ok:
          false,

        error:
          "CAPITAL_RECEIPT_ID_REQUIRED",
      },
    };
  }

  const idempotencyKey =
    request.headers
      .get(
        "Idempotency-Key",
      )
      ?.trim();

  if (
    !idempotencyKey
  ) {
    return {
      status:
        400,

      body: {
        ok:
          false,

        error:
          "IDEMPOTENCY_KEY_REQUIRED",
      },
    };
  }

  const context = {
    commandId:
      `program-capital-receipt-verification-start-command-${generateIdentity()}`,

    actorId:
      principal.userId,

    correlationId:
      `program-capital-receipt-verification-${generateIdentity()}`,

    requestedAt:
      now(),

    idempotencyKey,
  };

  const eventId =
    `program-capital-receipt-verification-started-event-${generateIdentity()}`;

  async function execute() {
    return prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        beginProgramCapitalReceiptVerificationIdempotentlyWithClient({
          receiptId,

          eventId,

          context,

          client:
            tx,
        }),
    );
  }

  let result;

  try {
    result =
      await execute();
  } catch (
    error:
      unknown
  ) {
    if (
      isErrorCode(
        error,
        "TREASURY_GATEWAY_CAPITAL_RECEIPT_NOT_FOUND",
      ) ||
      isErrorCode(
        error,
        "TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_NOT_FOUND",
      )
    ) {
      return {
        status:
          404,

        body: {
          ok:
            false,

          error:
            "CAPITAL_RECEIPT_NOT_FOUND",
        },
      };
    }

    if (
      isErrorCode(
        error,
        "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
      ) ||
      isErrorCode(
        error,
        "TREASURY_GATEWAY_COMMAND_KIND_COLLISION",
      ) ||
      isErrorCode(
        error,
        "TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_MISMATCH",
      )
    ) {
      return {
        status:
          409,

        body: {
          ok:
            false,

          error:
            "CAPITAL_RECEIPT_VERIFICATION_START_IDEMPOTENCY_COLLISION",
        },
      };
    }

    if (
      isErrorCode(
        error,
        "PROGRAM_CAPITAL_RECEIPT_TRANSITION_INVALID",
      )
    ) {
      return {
        status:
          409,

        body: {
          ok:
            false,

          error:
            "CAPITAL_RECEIPT_VERIFICATION_START_TRANSITION_INVALID",
        },
      };
    }

    if (
      isErrorCode(
        error,
        "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_CONFLICT",
      )
    ) {
      try {
        result =
          await execute();
      } catch (
        retryError:
          unknown
      ) {
        if (
          isErrorCode(
            retryError,
            "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
          ) ||
          isErrorCode(
            retryError,
            "TREASURY_GATEWAY_COMMAND_KIND_COLLISION",
          ) ||
          isErrorCode(
            retryError,
            "TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_MISMATCH",
          )
        ) {
          return {
            status:
              409,

            body: {
              ok:
                false,

              error:
                "CAPITAL_RECEIPT_VERIFICATION_START_IDEMPOTENCY_COLLISION",
            },
          };
        }

        if (
          isErrorCode(
            retryError,
            "PROGRAM_CAPITAL_RECEIPT_TRANSITION_INVALID",
          )
        ) {
          return {
            status:
              409,

            body: {
              ok:
                false,

              error:
                "CAPITAL_RECEIPT_VERIFICATION_START_TRANSITION_INVALID",
            },
          };
        }

        throw retryError;
      }
    } else {
      throw error;
    }
  }

  return {
    status:
      200,

    body: {
      ok:
        true,

      disposition:
        result.disposition,

      receipt: {
        id:
          result.aggregate.id,

        reference:
          result.aggregate.reference,

        status:
          result.aggregate.status,

        version:
          result.aggregate.metadata.version,

        programId:
          result.aggregate.programId,

        destinationProgramAccountId:
          result.aggregate.destinationProgramAccountId,

        updatedAt:
          result.aggregate.metadata.updatedAt.toISOString(),
      },
    },
  };
}
