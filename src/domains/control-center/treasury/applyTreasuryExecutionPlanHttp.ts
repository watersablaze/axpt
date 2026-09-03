import { randomUUID } from "node:crypto";

import type { PrismaClient, TransactionClient } from "@prisma/client";

import type { Principal } from "../../auth/types";
import { applyTreasuryExecutionPlanIdempotentlyWithClient } from "@/domains/treasury/gateway/transfers/application/applyTreasuryExecutionPlanIdempotentlyWithClient";

type IdentityFactory = () => string;

type ControlCenterApplyTreasuryExecutionPlanHttpResult = Readonly<{
  status: number;

  body: Readonly<Record<string, unknown>>;
}>;

function isErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && error.message.includes(code);
}

export async function applyTreasuryExecutionPlanHttp(params: {
  rawTransferId: string;

  rawPlanId: string;

  request: Request;

  principal: Principal;

  prisma: PrismaClient;

  generateIdentity?: IdentityFactory;

  now?: () => Date;
}): Promise<ControlCenterApplyTreasuryExecutionPlanHttpResult> {
  const {
    rawTransferId,
    rawPlanId,
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

  const planId = rawPlanId.trim();

  if (planId.length === 0) {
    return {
      status: 400,

      body: {
        ok: false,

        error: "EXECUTION_PLAN_ID_REQUIRED",
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
    commandId: `treasury-execution-plan-application-command-${generateIdentity()}`,

    actorId: principal.userId,

    correlationId: `treasury-execution-plan-application-${generateIdentity()}`,

    requestedAt: now(),

    idempotencyKey,
  };

  const eventId = `treasury-execution-plan-applied-event-${generateIdentity()}`;

  async function execute() {
    return prisma.$transaction(async (tx: TransactionClient) =>
      applyTreasuryExecutionPlanIdempotentlyWithClient({
        transferId,

        planId,

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
    if (isErrorCode(error, "TREASURY_GATEWAY_EXECUTION_PLAN_NOT_FOUND")) {
      return {
        status: 404,

        body: {
          ok: false,

          error: "TREASURY_EXECUTION_PLAN_NOT_FOUND",
        },
      };
    }

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
      isErrorCode(error, "TREASURY_EXECUTION_PLAN_TRANSFER_MISMATCH") ||
      isErrorCode(error, "TREASURY_EXECUTION_PLAN_COMMAND_TARGET_MISMATCH")
    ) {
      return {
        status: 409,

        body: {
          ok: false,

          error: "TREASURY_EXECUTION_PLAN_TARGET_MISMATCH",
        },
      };
    }

    if (
      isErrorCode(error, "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION") ||
      isErrorCode(error, "TREASURY_GATEWAY_COMMAND_KIND_COLLISION") ||
      isErrorCode(error, "TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_MISMATCH")
    ) {
      return {
        status: 409,

        body: {
          ok: false,

          error: "TREASURY_EXECUTION_PLAN_APPLICATION_IDEMPOTENCY_COLLISION",
        },
      };
    }

    /*
     * Another request may win persistence of the same idempotency
     * key after this request's initial lookup.
     *
     * Retry the unchanged application once so the durable command
     * receipt can resolve the accepted Transfer.
     */
    if (isErrorCode(error, "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_CONFLICT")) {
      try {
        result = await execute();
      } catch (retryError: unknown) {
        if (
          isErrorCode(
            retryError,
            "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
          ) ||
          isErrorCode(retryError, "TREASURY_GATEWAY_COMMAND_KIND_COLLISION") ||
          isErrorCode(
            retryError,
            "TREASURY_GATEWAY_COMMAND_RECEIPT_TARGET_MISMATCH",
          )
        ) {
          return {
            status: 409,

            body: {
              ok: false,

              error:
                "TREASURY_EXECUTION_PLAN_APPLICATION_IDEMPOTENCY_COLLISION",
            },
          };
        }

        throw retryError;
      }
    } else {
      /*
       * Transition-law failures remain Treasury conflicts.
       * HTTP does not reinterpret or manufacture lifecycle law.
       */
      if (isErrorCode(error, "TRANSITION")) {
        return {
          status: 409,

          body: {
            ok: false,

            error: "TREASURY_EXECUTION_PLAN_APPLICATION_TRANSITION_INVALID",
          },
        };
      }

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

        status: result.aggregate.status,

        version: result.aggregate.metadata.version,
      },

      planId,
    },
  };
}
