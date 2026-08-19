import { randomUUID } from "node:crypto";

import type { PrismaClient, TransactionClient } from "@prisma/client";

import type { Principal } from "../../auth/types";

import { beginTreasuryTransferAuthorityReviewIdempotentlyWithClient } from "../../treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewIdempotentlyWithClient";

export type ControlCenterTreasuryAuthorityReviewHttpResult =
  | Readonly<{
      status: 200;

      body: Readonly<{
        ok: true;

        disposition: "STARTED" | "REPLAYED";

        transfer: Readonly<{
          id: string;

          reference: string;

          status: string;

          version: number;

          programId: string;

          updatedAt: string;
        }>;
      }>;
    }>
  | Readonly<{
      status: 400 | 404 | 409;

      body: Readonly<{
        ok: false;

        error: string;
      }>;
    }>;

type IdentityFactory = () => string;

function isErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && error.message.includes(code);
}

export async function beginTreasuryTransferAuthorityReviewHttp(params: {
  rawTransferId: string;

  request: Request;

  principal: Principal;

  prisma: PrismaClient;

  generateIdentity?: IdentityFactory;

  now?: () => Date;
}): Promise<ControlCenterTreasuryAuthorityReviewHttpResult> {
  const {
    rawTransferId,
    request,
    principal,
    prisma,
    generateIdentity = randomUUID,
    now = () => new Date(),
  } = params;

  const transferId = rawTransferId.trim();

  if (transferId.length === 0) {
    return {
      status: 400,

      body: {
        ok: false,

        error: "TRANSFER_ID_REQUIRED",
      },
    };
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();

  if (!idempotencyKey) {
    return {
      status: 400,

      body: {
        ok: false,

        error: "IDEMPOTENCY_KEY_REQUIRED",
      },
    };
  }

  const context = {
    commandId: `treasury-transfer-authority-review-command-${generateIdentity()}`,

    actorId: principal.userId,

    correlationId: `treasury-transfer-authority-review-${generateIdentity()}`,

    requestedAt: now(),

    idempotencyKey,
  };

  const eventId = `treasury-transfer-authority-review-started-event-${generateIdentity()}`;

  async function execute() {
    return prisma.$transaction(async (tx: TransactionClient) =>
      beginTreasuryTransferAuthorityReviewIdempotentlyWithClient({
        transferId,

        eventId,

        context,

        client: tx,
      }),
    );
  }

  let result;

  try {
    result = await execute();
  } catch (error: unknown) {
    if (isErrorCode(error, "TREASURY_GATEWAY_TRANSFER_NOT_FOUND")) {
      return {
        status: 404,

        body: {
          ok: false,

          error: "TREASURY_TRANSFER_NOT_FOUND",
        },
      };
    }

    if (
      isErrorCode(error, "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION") ||
      isErrorCode(error, "TREASURY_GATEWAY_COMMAND_KIND_COLLISION")
    ) {
      return {
        status: 409,

        body: {
          ok: false,

          error: "TREASURY_AUTHORITY_REVIEW_IDEMPOTENCY_COLLISION",
        },
      };
    }

    if (isErrorCode(error, "TREASURY_TRANSFER_TRANSITION_INVALID")) {
      return {
        status: 409,

        body: {
          ok: false,

          error: "TREASURY_AUTHORITY_REVIEW_TRANSITION_INVALID",
        },
      };
    }

    if (isErrorCode(error, "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_CONFLICT")) {
      try {
        result = await execute();
      } catch (retryError: unknown) {
        if (
          isErrorCode(
            retryError,
            "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
          ) ||
          isErrorCode(retryError, "TREASURY_GATEWAY_COMMAND_KIND_COLLISION")
        ) {
          return {
            status: 409,

            body: {
              ok: false,

              error: "TREASURY_AUTHORITY_REVIEW_IDEMPOTENCY_COLLISION",
            },
          };
        }

        if (isErrorCode(retryError, "TREASURY_TRANSFER_TRANSITION_INVALID")) {
          return {
            status: 409,

            body: {
              ok: false,

              error: "TREASURY_AUTHORITY_REVIEW_TRANSITION_INVALID",
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
    status: 200,

    body: {
      ok: true,

      disposition: result.disposition,

      transfer: {
        id: result.aggregate.id,

        reference: result.aggregate.reference,

        status: result.aggregate.status,

        version: result.aggregate.metadata.version,

        programId: result.aggregate.programId,

        updatedAt: result.aggregate.metadata.updatedAt.toISOString(),
      },
    },
  };
}
