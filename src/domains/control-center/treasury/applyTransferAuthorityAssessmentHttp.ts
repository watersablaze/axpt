import { randomUUID } from "node:crypto";

import type { PrismaClient, TransactionClient } from "@prisma/client";

import type { Principal } from "../../auth/types";

import { applyTreasuryTransferAuthorityAssessmentIdempotentlyWithClient } from "../../treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentIdempotentlyWithClient";

type IdentityFactory = () => string;

export type ControlCenterApplyAuthorityAssessmentHttpResult =
  | Readonly<{
      status: 200;

      body: Readonly<{
        ok: true;

        disposition: "APPLIED" | "REPLAYED";

        transfer: Readonly<{
          id: string;

          reference: string;

          status: string;

          version: number;

          programId: string;

          updatedAt: string;
        }>;

        assessmentId: string;
      }>;
    }>
  | Readonly<{
      status: 400 | 404 | 409;

      body: Readonly<{
        ok: false;

        error: string;
      }>;
    }>;

function isErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && error.message.includes(code);
}

export async function applyTransferAuthorityAssessmentHttp(params: {
  rawTransferId: string;

  rawAssessmentId: string;

  request: Request;

  principal: Principal;

  prisma: PrismaClient;

  generateIdentity?: IdentityFactory;

  now?: () => Date;
}): Promise<ControlCenterApplyAuthorityAssessmentHttpResult> {
  const {
    rawTransferId,
    rawAssessmentId,
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

  const assessmentId = rawAssessmentId.trim();

  if (assessmentId.length === 0) {
    return {
      status: 400,

      body: {
        ok: false,

        error: "AUTHORITY_ASSESSMENT_ID_REQUIRED",
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
    commandId: `treasury-transfer-authority-assessment-application-command-${generateIdentity()}`,

    actorId: principal.userId,

    correlationId: `treasury-transfer-authority-assessment-application-${generateIdentity()}`,

    requestedAt: now(),

    idempotencyKey,
  };

  const eventId = `treasury-transfer-authority-assessment-applied-event-${generateIdentity()}`;

  async function execute() {
    return prisma.$transaction(async (tx: TransactionClient) =>
      applyTreasuryTransferAuthorityAssessmentIdempotentlyWithClient({
        transferId,

        assessmentId,

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
    if (
      isErrorCode(
        error,
        "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_NOT_FOUND",
      )
    ) {
      return {
        status: 404,

        body: {
          ok: false,

          error: "TREASURY_AUTHORITY_ASSESSMENT_NOT_FOUND",
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
      isErrorCode(error, "TRANSFER_AUTHORITY_ASSESSMENT_TRANSFER_MISMATCH") ||
      isErrorCode(
        error,
        "TRANSFER_AUTHORITY_ASSESSMENT_COMMAND_TARGET_MISMATCH",
      )
    ) {
      return {
        status: 409,

        body: {
          ok: false,

          error: "TREASURY_AUTHORITY_ASSESSMENT_TARGET_MISMATCH",
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

          error:
            "TREASURY_AUTHORITY_ASSESSMENT_APPLICATION_IDEMPOTENCY_COLLISION",
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

              error:
                "TREASURY_AUTHORITY_ASSESSMENT_APPLICATION_IDEMPOTENCY_COLLISION",
            },
          };
        }

        throw retryError;
      }
    } else {
      /*
       * Transition-law failures are deliberately surfaced as a
       * conflict. The HTTP layer does not reinterpret Treasury law.
       */
      if (isErrorCode(error, "TRANSITION")) {
        return {
          status: 409,

          body: {
            ok: false,

            error:
              "TREASURY_AUTHORITY_ASSESSMENT_APPLICATION_TRANSITION_INVALID",
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

        reference: result.aggregate.reference,

        status: result.aggregate.status,

        version: result.aggregate.metadata.version,

        programId: result.aggregate.programId,

        updatedAt: result.aggregate.metadata.updatedAt.toISOString(),
      },

      assessmentId,
    },
  };
}
