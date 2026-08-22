import { randomUUID } from "node:crypto";

import type { PrismaClient, TransactionClient } from "@prisma/client";

import type { Principal } from "../../auth/types";

import { recordTransferCapacityAssessmentIdempotentlyWithClient } from "../../treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentIdempotentlyWithClient";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
  type TransferCapacityConstraint,
} from "../../treasury/gateway/transfer-capacity-assessments/contracts";

import type { TreasuryMoney } from "../../treasury/gateway/shared/money";

type IdentityFactory = () => string;

type CapacityAssessmentRequestBody = Readonly<{
  requestedAmount?: unknown;

  constraints?: unknown;

  assessedAt?: unknown;

  notes?: unknown;
}>;

export type ControlCenterRecordCapacityAssessmentHttpResult =
  | Readonly<{
      status: 201 | 200;

      body: Readonly<{
        ok: true;

        disposition: "RECORDED" | "REPLAYED";

        assessment: Readonly<{
          id: string;

          transferId: string;

          requestedAmount: TreasuryMoney;

          constraints: readonly TransferCapacityConstraint[];

          executableNow?: TreasuryMoney;

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

function requireRecord(value: unknown, code: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(code);
  }

  return value as Record<string, unknown>;
}

function parseMoney(value: unknown, code: string): TreasuryMoney {
  const record = requireRecord(value, code);

  if (typeof record.amount !== "string" || record.amount.trim().length === 0) {
    throw new Error(code);
  }

  if (
    typeof record.currency !== "string" ||
    record.currency.trim().length === 0
  ) {
    throw new Error(code);
  }

  return {
    amount: record.amount.trim(),

    currency: record.currency.trim(),
  };
}

function parseOptionalMoney(
  value: unknown,
  code: string,
): TreasuryMoney | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return parseMoney(value, code);
}

function parseEvidenceReferenceIds(
  value: unknown,
  index: number,
): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`CAPACITY_ASSESSMENT_CONSTRAINT_EVIDENCE_INVALID:${index}`);
  }

  return value.map((entry, evidenceIndex) => {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      throw new Error(
        `CAPACITY_ASSESSMENT_CONSTRAINT_EVIDENCE_INVALID:${index}:${evidenceIndex}`,
      );
    }

    return entry.trim();
  });
}

function parseConstraint(
  value: unknown,
  index: number,
): TransferCapacityConstraint {
  const record = requireRecord(
    value,
    `CAPACITY_ASSESSMENT_CONSTRAINT_INVALID:${index}`,
  );

  if (
    typeof record.type !== "string" ||
    !Object.values(TRANSFER_CAPACITY_CONSTRAINT_TYPE).includes(
      record.type as TransferCapacityConstraint["type"],
    )
  ) {
    throw new Error(`CAPACITY_ASSESSMENT_CONSTRAINT_TYPE_INVALID:${index}`);
  }

  if (
    typeof record.status !== "string" ||
    !Object.values(TRANSFER_CAPACITY_CONSTRAINT_STATUS).includes(
      record.status as TransferCapacityConstraint["status"],
    )
  ) {
    throw new Error(`CAPACITY_ASSESSMENT_CONSTRAINT_STATUS_INVALID:${index}`);
  }

  const limit = parseOptionalMoney(
    record.limit,
    `CAPACITY_ASSESSMENT_CONSTRAINT_LIMIT_INVALID:${index}`,
  );

  const notes = optionalNonEmptyString(record.notes);

  return {
    type: record.type as TransferCapacityConstraint["type"],

    status: record.status as TransferCapacityConstraint["status"],

    ...(limit
      ? {
          limit,
        }
      : {}),

    evidenceReferenceIds: parseEvidenceReferenceIds(
      record.evidenceReferenceIds,
      index,
    ),

    ...(notes
      ? {
          notes,
        }
      : {}),
  };
}

function parseRequestBody(body: CapacityAssessmentRequestBody): {
  requestedAmount: TreasuryMoney;

  constraints: readonly TransferCapacityConstraint[];

  assessedAt: Date;

  notes?: string;
} {
  const requestedAmount = parseMoney(
    body.requestedAmount,
    "CAPACITY_ASSESSMENT_REQUESTED_AMOUNT_INVALID",
  );

  if (!Array.isArray(body.constraints)) {
    throw new Error("CAPACITY_ASSESSMENT_CONSTRAINTS_REQUIRED");
  }

  if (body.constraints.length === 0) {
    throw new Error("CAPACITY_ASSESSMENT_CONSTRAINTS_REQUIRED");
  }

  const constraints = body.constraints.map((constraint, index) =>
    parseConstraint(constraint, index),
  );

  if (typeof body.assessedAt !== "string") {
    throw new Error("CAPACITY_ASSESSMENT_ASSESSED_AT_INVALID");
  }

  const assessedAt = new Date(body.assessedAt);

  if (Number.isNaN(assessedAt.getTime())) {
    throw new Error("CAPACITY_ASSESSMENT_ASSESSED_AT_INVALID");
  }

  return {
    requestedAmount,

    constraints,

    assessedAt,

    notes: optionalNonEmptyString(body.notes),
  };
}

export async function recordTransferCapacityAssessmentHttp(params: {
  rawTransferId: string;

  request: Request;

  principal: Principal;

  prisma: PrismaClient;

  generateIdentity?: IdentityFactory;

  now?: () => Date;
}): Promise<ControlCenterRecordCapacityAssessmentHttpResult> {
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

  let rawBody: CapacityAssessmentRequestBody;

  try {
    rawBody = (await request.json()) as CapacityAssessmentRequestBody;
  } catch {
    return {
      status: 400,

      body: {
        ok: false,

        error: "CAPACITY_ASSESSMENT_BODY_INVALID",
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
            : "CAPACITY_ASSESSMENT_BODY_INVALID",
      },
    };
  }

  const assessmentId = `transfer-capacity-assessment-${generateIdentity()}`;

  const requestRecord = {
    assessmentId,

    eventId: `transfer-capacity-assessment-recorded-event-${generateIdentity()}`,

    context: {
      commandId: `transfer-capacity-assessment-command-${generateIdentity()}`,

      actorId: principal.userId,

      correlationId: `transfer-capacity-assessment-${generateIdentity()}`,

      requestedAt: now(),

      idempotencyKey,
    },

    payload: {
      transferId,

      ...payload,
    },
  };

  async function execute() {
    return prisma.$transaction(async (tx: TransactionClient) =>
      recordTransferCapacityAssessmentIdempotentlyWithClient({
        request: requestRecord,

        client: tx,
      }),
    );
  }

  function success(
    result: Awaited<ReturnType<typeof execute>>,
  ): ControlCenterRecordCapacityAssessmentHttpResult {
    return {
      status: result.disposition === "RECORDED" ? 201 : 200,

      body: {
        ok: true,

        disposition: result.disposition,

        assessment: {
          id: result.aggregate.id,

          transferId: result.aggregate.transferId,

          requestedAmount: result.aggregate.requestedAmount,

          constraints: result.aggregate.constraints,

          executableNow: result.aggregate.executableNow,

          assessedByActorId: result.aggregate.assessedByActorId,

          assessedAt: result.aggregate.assessedAt.toISOString(),

          notes: result.aggregate.notes,

          version: result.aggregate.metadata.version,

          createdAt: result.aggregate.metadata.createdAt.toISOString(),
        },
      },
    };
  }

  try {
    return success(await execute());
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
      isErrorCode(error, "TRANSFER_CAPACITY_ASSESSMENT_TRANSFER_STATUS_INVALID")
    ) {
      return {
        status: 409,

        body: {
          ok: false,

          error: "TREASURY_CAPACITY_ASSESSMENT_TRANSFER_STATUS_INVALID",
        },
      };
    }

    if (
      isErrorCode(
        error,
        "TRANSFER_CAPACITY_ASSESSMENT_REQUESTED_AMOUNT_MISMATCH",
      )
    ) {
      return {
        status: 409,

        body: {
          ok: false,

          error: "TREASURY_CAPACITY_ASSESSMENT_REQUESTED_AMOUNT_MISMATCH",
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

          error: "TREASURY_CAPACITY_ASSESSMENT_IDEMPOTENCY_COLLISION",
        },
      };
    }

    /*
     * A concurrent request can win persistence of the same
     * idempotency key after the initial lookup.
     *
     * Retry the unchanged canonical request once so the
     * Gateway receipt resolves the accepted finding.
     */
    if (isErrorCode(error, "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_CONFLICT")) {
      try {
        return success(await execute());
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

              error: "TREASURY_CAPACITY_ASSESSMENT_IDEMPOTENCY_COLLISION",
            },
          };
        }

        throw retryError;
      }
    }

    throw error;
  }
}
