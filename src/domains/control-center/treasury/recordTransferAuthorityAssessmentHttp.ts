import { randomUUID } from "node:crypto";

import type { PrismaClient, TransactionClient } from "@prisma/client";

import type { Principal } from "../../auth/types";

import { recordTransferAuthorityAssessmentIdempotentlyWithClient } from "../../treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentIdempotentlyWithClient";

import {
  TRANSFER_AUTHORITY_ASSESSMENT_RESULT,
  type TransferAuthorityAssessmentResult,
} from "../../treasury/gateway/transfer-authority-assessments/contracts";

type IdentityFactory = () => string;

type AssessmentRequestBody = Readonly<{
  result?: unknown;

  instructionId?: unknown;

  authorityGrantId?: unknown;

  evidenceArtifactIds?: unknown;

  assessedAt?: unknown;

  notes?: unknown;
}>;

export type ControlCenterRecordAuthorityAssessmentHttpResult =
  | Readonly<{
      status: 201 | 200;

      body: Readonly<{
        ok: true;

        disposition: "RECORDED" | "REPLAYED";

        assessment: Readonly<{
          id: string;

          transferId: string;

          result: string;

          instructionId?: string;

          authorityGrantId?: string;

          evidenceArtifactIds: readonly string[];

          assessedByActorId: string;

          assessedAt: string;

          notes?: string;

          version: number;

          createdAt: string;
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

function isErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && error.message.includes(code);
}

function optionalNonEmptyString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("OPTIONAL_STRING_INVALID");
  }

  return value.trim();
}

function parseRequestBody(body: AssessmentRequestBody): {
  result: TransferAuthorityAssessmentResult;

  instructionId?: string;

  authorityGrantId?: string;

  evidenceArtifactIds: readonly string[];

  assessedAt: Date;

  notes?: string;
} {
  if (
    typeof body.result !== "string" ||
    !Object.values(TRANSFER_AUTHORITY_ASSESSMENT_RESULT).includes(
      body.result as TransferAuthorityAssessmentResult,
    )
  ) {
    throw new Error("AUTHORITY_ASSESSMENT_RESULT_INVALID");
  }

  if (!Array.isArray(body.evidenceArtifactIds)) {
    throw new Error("AUTHORITY_ASSESSMENT_EVIDENCE_REQUIRED");
  }

  const evidenceArtifactIds = body.evidenceArtifactIds.map((value, index) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`AUTHORITY_ASSESSMENT_EVIDENCE_INVALID:${index}`);
    }

    return value.trim();
  });

  if (evidenceArtifactIds.length === 0) {
    throw new Error("AUTHORITY_ASSESSMENT_EVIDENCE_REQUIRED");
  }

  if (typeof body.assessedAt !== "string") {
    throw new Error("AUTHORITY_ASSESSMENT_ASSESSED_AT_INVALID");
  }

  const assessedAt = new Date(body.assessedAt);

  if (Number.isNaN(assessedAt.getTime())) {
    throw new Error("AUTHORITY_ASSESSMENT_ASSESSED_AT_INVALID");
  }

  return {
    result: body.result as TransferAuthorityAssessmentResult,

    instructionId: optionalNonEmptyString(body.instructionId),

    authorityGrantId: optionalNonEmptyString(body.authorityGrantId),

    evidenceArtifactIds,

    assessedAt,

    notes: optionalNonEmptyString(body.notes),
  };
}

export async function recordTransferAuthorityAssessmentHttp(params: {
  rawTransferId: string;

  request: Request;

  principal: Principal;

  prisma: PrismaClient;

  generateIdentity?: IdentityFactory;

  now?: () => Date;
}): Promise<ControlCenterRecordAuthorityAssessmentHttpResult> {
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

  let rawBody: AssessmentRequestBody;

  try {
    rawBody = (await request.json()) as AssessmentRequestBody;
  } catch {
    return {
      status: 400,

      body: {
        ok: false,

        error: "AUTHORITY_ASSESSMENT_BODY_INVALID",
      },
    };
  }

  let payload;

  try {
    payload = parseRequestBody(rawBody);
  } catch (error: unknown) {
    return {
      status: 400,

      body: {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "AUTHORITY_ASSESSMENT_BODY_INVALID",
      },
    };
  }

  const assessmentId = `transfer-authority-assessment-${generateIdentity()}`;

  const requestRecord = {
    assessmentId,

    eventId: `transfer-authority-assessment-recorded-event-${generateIdentity()}`,

    context: {
      commandId: `transfer-authority-assessment-command-${generateIdentity()}`,

      actorId: principal.userId,

      authorityGrantId: payload.authorityGrantId,

      correlationId: `transfer-authority-assessment-${generateIdentity()}`,

      requestedAt: now(),

      idempotencyKey,
    },

    payload: {
      transferId,

      ...payload,
    },
  };

  try {
    const result = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTransferAuthorityAssessmentIdempotentlyWithClient({
        request: requestRecord,

        client: tx,
      }),
    );

    return {
      status: result.disposition === "RECORDED" ? 201 : 200,

      body: {
        ok: true,

        disposition: result.disposition,

        assessment: {
          id: result.aggregate.id,

          transferId: result.aggregate.transferId,

          result: result.aggregate.result,

          instructionId: result.aggregate.instructionId,

          authorityGrantId: result.aggregate.authorityGrantId,

          evidenceArtifactIds: result.aggregate.evidenceArtifactIds,

          assessedByActorId: result.aggregate.assessedByActorId,

          assessedAt: result.aggregate.assessedAt.toISOString(),

          notes: result.aggregate.notes,

          version: result.aggregate.metadata.version,

          createdAt: result.aggregate.metadata.createdAt.toISOString(),
        },
      },
    };
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
      isErrorCode(
        error,
        "TRANSFER_AUTHORITY_ASSESSMENT_TRANSFER_STATUS_INVALID",
      )
    ) {
      return {
        status: 409,

        body: {
          ok: false,

          error: "TREASURY_AUTHORITY_ASSESSMENT_TRANSFER_STATUS_INVALID",
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

          error: "TREASURY_AUTHORITY_ASSESSMENT_IDEMPOTENCY_COLLISION",
        },
      };
    }

    /*
     * A concurrent request can win persistence of the same
     * idempotency key after this request's initial lookup.
     *
     * Retry the unchanged canonical request once. The Gateway
     * receipt then resolves the original accepted assessment.
     */
    if (isErrorCode(error, "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_CONFLICT")) {
      try {
        const result = await prisma.$transaction(
          async (tx: TransactionClient) =>
            recordTransferAuthorityAssessmentIdempotentlyWithClient({
              request: requestRecord,

              client: tx,
            }),
        );

        return {
          status: result.disposition === "RECORDED" ? 201 : 200,

          body: {
            ok: true,

            disposition: result.disposition,

            assessment: {
              id: result.aggregate.id,

              transferId: result.aggregate.transferId,

              result: result.aggregate.result,

              instructionId: result.aggregate.instructionId,

              authorityGrantId: result.aggregate.authorityGrantId,

              evidenceArtifactIds: result.aggregate.evidenceArtifactIds,

              assessedByActorId: result.aggregate.assessedByActorId,

              assessedAt: result.aggregate.assessedAt.toISOString(),

              notes: result.aggregate.notes,

              version: result.aggregate.metadata.version,

              createdAt: result.aggregate.metadata.createdAt.toISOString(),
            },
          },
        };
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

              error: "TREASURY_AUTHORITY_ASSESSMENT_IDEMPOTENCY_COLLISION",
            },
          };
        }

        throw retryError;
      }
    }

    throw error;
  }
}
