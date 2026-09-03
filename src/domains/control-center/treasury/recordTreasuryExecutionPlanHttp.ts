import { randomUUID } from "node:crypto";

import type { PrismaClient, TransactionClient } from "@prisma/client";

import type { Principal } from "../../auth/types";

import { TREASURY_EXECUTION_KIND } from "../../treasury/gateway/executions/contracts";

import { recordTreasuryExecutionPlanIdempotentlyWithClient } from "../../treasury/gateway/execution-plans/application/recordTreasuryExecutionPlanIdempotentlyWithClient";

import type { RecordTreasuryExecutionPlanTranche } from "../../treasury/gateway/execution-plans/commands";

import type { TreasuryMoney } from "../../treasury/gateway/shared/money";

type IdentityFactory = () => string;

type ExecutionPlanRequestBody = Readonly<{
  capacityAssessmentId?: unknown;
  plannedAmount?: unknown;
  destinationCurrency?: unknown;
  tranches?: unknown;
  plannedAt?: unknown;
  notes?: unknown;
}>;

export type ControlCenterRecordTreasuryExecutionPlanHttpResult =
  | Readonly<{
      status: 201 | 200;

      body: Readonly<{
        ok: true;

        disposition: "RECORDED" | "REPLAYED";

        plan: Readonly<{
          id: string;
          transferId: string;
          capacityAssessmentId: string;
          plannedAmount: TreasuryMoney;
          destinationCurrency: string;
          tranches: readonly Readonly<{
            id: string;
            sequence: number;
            amount: TreasuryMoney;
            executionKind: string;
            allocationId: string;
            instructionId?: string;
            beneficiaryProfileId?: string;
            settlementEndpointId: string;
            purpose: string;
            status: string;
            executionId?: string;
          }>[];
          status: string;
          plannedByActorId: string;
          plannedAt: string;
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

function requireRecord(value: unknown, code: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(code);
  }

  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, code: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(code);
  }

  return value.trim();
}

function optionalNonEmptyString(
  value: unknown,
  code: string,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(code);
  }

  return value.trim();
}

function parseMoney(value: unknown, code: string): TreasuryMoney {
  const record = requireRecord(value, code);

  return {
    amount: requireNonEmptyString(record.amount, code),
    currency: requireNonEmptyString(record.currency, code),
  };
}

function parseTranche(
  value: unknown,
  index: number,
): RecordTreasuryExecutionPlanTranche {
  const code = `EXECUTION_PLAN_TRANCHE_INVALID:${index}`;

  const record = requireRecord(value, code);

  const sequence = record.sequence;

  if (
    typeof sequence !== "number" ||
    !Number.isInteger(sequence) ||
    sequence < 1
  ) {
    throw new Error(`EXECUTION_PLAN_TRANCHE_SEQUENCE_INVALID:${index}`);
  }

  const executionKind = requireNonEmptyString(
    record.executionKind,
    `EXECUTION_PLAN_TRANCHE_EXECUTION_KIND_INVALID:${index}`,
  );

  if (
    !Object.values(TREASURY_EXECUTION_KIND).includes(
      executionKind as RecordTreasuryExecutionPlanTranche["executionKind"],
    )
  ) {
    throw new Error(`EXECUTION_PLAN_TRANCHE_EXECUTION_KIND_INVALID:${index}`);
  }

  const instructionId = optionalNonEmptyString(
    record.instructionId,
    `EXECUTION_PLAN_TRANCHE_INSTRUCTION_ID_INVALID:${index}`,
  );

  const beneficiaryProfileId = optionalNonEmptyString(
    record.beneficiaryProfileId,
    `EXECUTION_PLAN_TRANCHE_BENEFICIARY_PROFILE_ID_INVALID:${index}`,
  );

  return {
    trancheId: requireNonEmptyString(
      record.trancheId,
      `EXECUTION_PLAN_TRANCHE_ID_INVALID:${index}`,
    ),

    sequence,

    amount: parseMoney(
      record.amount,
      `EXECUTION_PLAN_TRANCHE_AMOUNT_INVALID:${index}`,
    ),

    executionKind:
      executionKind as RecordTreasuryExecutionPlanTranche["executionKind"],

    allocationId: requireNonEmptyString(
      record.allocationId,
      `EXECUTION_PLAN_TRANCHE_ALLOCATION_ID_INVALID:${index}`,
    ),

    ...(instructionId ? { instructionId } : {}),

    ...(beneficiaryProfileId ? { beneficiaryProfileId } : {}),

    settlementEndpointId: requireNonEmptyString(
      record.settlementEndpointId,
      `EXECUTION_PLAN_TRANCHE_SETTLEMENT_ENDPOINT_ID_INVALID:${index}`,
    ),

    purpose: requireNonEmptyString(
      record.purpose,
      `EXECUTION_PLAN_TRANCHE_PURPOSE_INVALID:${index}`,
    ),
  };
}

function parseRequestBody(body: ExecutionPlanRequestBody) {
  const capacityAssessmentId = requireNonEmptyString(
    body.capacityAssessmentId,
    "EXECUTION_PLAN_CAPACITY_ASSESSMENT_ID_REQUIRED",
  );

  const plannedAmount = parseMoney(
    body.plannedAmount,
    "EXECUTION_PLAN_PLANNED_AMOUNT_INVALID",
  );

  const destinationCurrency = requireNonEmptyString(
    body.destinationCurrency,
    "EXECUTION_PLAN_DESTINATION_CURRENCY_INVALID",
  );

  if (!Array.isArray(body.tranches) || body.tranches.length === 0) {
    throw new Error("EXECUTION_PLAN_TRANCHES_REQUIRED");
  }

  const tranches = body.tranches.map(parseTranche);

  if (typeof body.plannedAt !== "string") {
    throw new Error("EXECUTION_PLAN_PLANNED_AT_INVALID");
  }

  const plannedAt = new Date(body.plannedAt);

  if (Number.isNaN(plannedAt.getTime())) {
    throw new Error("EXECUTION_PLAN_PLANNED_AT_INVALID");
  }

  const notes = optionalNonEmptyString(
    body.notes,
    "EXECUTION_PLAN_NOTES_INVALID",
  );

  return {
    capacityAssessmentId,
    plannedAmount,
    destinationCurrency,
    tranches,
    plannedAt,
    ...(notes ? { notes } : {}),
  };
}

export async function recordTreasuryExecutionPlanHttp(params: {
  rawTransferId: string;
  request: Request;
  principal: Principal;
  prisma: PrismaClient;
  generateIdentity?: IdentityFactory;
  now?: () => Date;
}): Promise<ControlCenterRecordTreasuryExecutionPlanHttpResult> {
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

  let rawBody: ExecutionPlanRequestBody;

  try {
    rawBody = (await request.json()) as ExecutionPlanRequestBody;
  } catch {
    return {
      status: 400,

      body: {
        ok: false,
        error: "EXECUTION_PLAN_BODY_INVALID",
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
            : "EXECUTION_PLAN_BODY_INVALID",
      },
    };
  }

  const planId = `treasury-execution-plan-${generateIdentity()}`;

  const requestRecord = {
    planId,

    eventId: `treasury-execution-plan-recorded-event-${generateIdentity()}`,

    context: {
      commandId: `treasury-execution-plan-command-${generateIdentity()}`,

      actorId: principal.userId,

      correlationId: `treasury-execution-plan-${generateIdentity()}`,

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
      recordTreasuryExecutionPlanIdempotentlyWithClient({
        request: requestRecord,

        client: tx,
      }),
    );
  }

  function success(
    result: Awaited<ReturnType<typeof execute>>,
  ): ControlCenterRecordTreasuryExecutionPlanHttpResult {
    return {
      status: result.disposition === "RECORDED" ? 201 : 200,

      body: {
        ok: true,

        disposition: result.disposition,

        plan: {
          id: result.aggregate.id,

          transferId: result.aggregate.transferId,

          capacityAssessmentId: result.aggregate.capacityAssessmentId,

          plannedAmount: result.aggregate.plannedAmount,

          destinationCurrency: result.aggregate.destinationCurrency,

          tranches: result.aggregate.tranches,

          status: result.aggregate.status,

          plannedByActorId: result.aggregate.plannedByActorId,

          plannedAt: result.aggregate.plannedAt.toISOString(),

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
      isErrorCode(
        error,
        "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_NOT_FOUND",
      )
    ) {
      return {
        status: 404,

        body: {
          ok: false,
          error: "TREASURY_CAPACITY_ASSESSMENT_NOT_FOUND",
        },
      };
    }

    if (isErrorCode(error, "TREASURY_EXECUTION_PLAN_TRANSFER_STATUS_INVALID")) {
      return {
        status: 409,

        body: {
          ok: false,
          error: "TREASURY_EXECUTION_PLAN_TRANSFER_STATUS_INVALID",
        },
      };
    }

    if (isErrorCode(error, "TREASURY_EXECUTION_PLAN_TRANSFER_MISMATCH")) {
      return {
        status: 409,

        body: {
          ok: false,
          error: "TREASURY_EXECUTION_PLAN_TRANSFER_MISMATCH",
        },
      };
    }

    if (
      isErrorCode(error, "TREASURY_EXECUTION_PLAN_CAPACITY_ASSESSMENT_MISMATCH")
    ) {
      return {
        status: 409,

        body: {
          ok: false,
          error: "TREASURY_EXECUTION_PLAN_CAPACITY_ASSESSMENT_MISMATCH",
        },
      };
    }

    if (
      isErrorCode(error, "TREASURY_EXECUTION_PLAN_TRANCHE_REQUIRED") ||
      isErrorCode(
        error,
        "TREASURY_EXECUTION_PLAN_CAPACITY_CURRENCY_MISMATCH",
      ) ||
      isErrorCode(
        error,
        "TREASURY_EXECUTION_PLAN_EXCEEDS_EXECUTABLE_CAPACITY",
      ) ||
      isErrorCode(
        error,
        "TREASURY_EXECUTION_PLAN_DUPLICATE_TRANCHE_SEQUENCE",
      ) ||
      isErrorCode(error, "TREASURY_EXECUTION_PLAN_TRANCHE_CURRENCY_MISMATCH") ||
      isErrorCode(error, "TREASURY_EXECUTION_PLAN_TRANCHE_TOTAL_MISMATCH") ||
      isErrorCode(error, "TREASURY_DECIMAL_INVALID") ||
      isErrorCode(error, "TREASURY_DECIMAL_NOT_POSITIVE")
    ) {
      return {
        status: 409,

        body: {
          ok: false,
          error: "TREASURY_EXECUTION_PLAN_INVALID",
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
          error: "TREASURY_EXECUTION_PLAN_IDEMPOTENCY_COLLISION",
        },
      };
    }

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
              error: "TREASURY_EXECUTION_PLAN_IDEMPOTENCY_COLLISION",
            },
          };
        }

        throw retryError;
      }
    }

    throw error;
  }
}
