import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import { TREASURY_EXECUTION_PLAN_STATUS } from "../status";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type { TreasuryExecutionPlan } from "../contracts";

import type { TreasuryExecutionPlanRecordedPayload } from "../events";

import type { PersistedNewTreasuryExecutionPlan } from "./contracts";

type PrismaKnownRequestError = Readonly<{
  code: string;

  meta?: Readonly<{
    target?: unknown;
  }>;
}>;

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

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

export async function persistNewTreasuryExecutionPlanWithClient(params: {
  result: TreasuryDomainResult<
    TreasuryExecutionPlan,
    TreasuryExecutionPlanRecordedPayload
  >;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<PersistedNewTreasuryExecutionPlan> {
  const { result, eventId, context, client } = params;

  const { aggregate, event } = result;

  if (aggregate.metadata.version !== 1) {
    throw new Error(
      `[TREASURY_GATEWAY_NEW_AGGREGATE_VERSION_INVALID] expected 1, received ${aggregate.metadata.version}`,
    );
  }

  if (aggregate.status !== TREASURY_EXECUTION_PLAN_STATUS.RECORDED) {
    throw new Error(
      `[TREASURY_GATEWAY_NEW_EXECUTION_PLAN_STATUS_INVALID] ${aggregate.status}`,
    );
  }

  if (
    event.eventType !== TREASURY_EVENT_TYPE.TREASURY_EXECUTION_PLAN_RECORDED
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_NEW_EXECUTION_PLAN_EVENT_INVALID] ${event.eventType}`,
    );
  }

  if (event.payload.planId !== aggregate.id) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_EVENT_TARGET_MISMATCH] ${event.payload.planId} -> ${aggregate.id}`,
    );
  }

  try {
    await client.treasuryGatewayAggregate.create({
      data: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: aggregate.id,

        version: aggregate.metadata.version,

        status: aggregate.status,

        snapshot: toJsonValue(aggregate),
      },
    });

    const persistedEvent = await client.treasuryGatewayEvent.create({
      data: {
        eventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: aggregate.id,

        aggregateVersion: aggregate.metadata.version,

        eventType: event.eventType,

        actorId: context.actorId,

        authorityGrantId: context.authorityGrantId,

        correlationId: context.correlationId,

        causationId: context.causationId,

        payload: toJsonValue(event.payload),

        occurredAt: event.occurredAt,
      },
    });

    return {
      aggregate,

      event: {
        eventId,

        sequence: persistedEvent.sequence,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: aggregate.id,

        aggregateVersion: aggregate.metadata.version,

        eventType: event.eventType,

        actorId: context.actorId,

        authorityGrantId: context.authorityGrantId,

        correlationId: context.correlationId,

        causationId: context.causationId,

        payload: event.payload,

        occurredAt: event.occurredAt,

        recordedAt: persistedEvent.recordedAt,

        previousEventHash: persistedEvent.previousEventHash ?? undefined,

        eventHash: persistedEvent.eventHash ?? undefined,
      },
    };
  } catch (error: unknown) {
    if (isPrismaKnownRequestError(error) && error.code === "P2002") {
      const target = getUniqueTarget(error);

      if (target.includes("eventId")) {
        throw new Error(`[TREASURY_GATEWAY_EVENT_ID_CONFLICT] ${eventId}`);
      }

      if (
        target.includes("aggregateType") &&
        target.includes("aggregateId") &&
        target.includes("aggregateVersion")
      ) {
        throw new Error(
          `[TREASURY_GATEWAY_AGGREGATE_VERSION_CONFLICT] ${aggregate.id}@${aggregate.metadata.version}`,
        );
      }

      throw new Error(
        `[TREASURY_GATEWAY_AGGREGATE_ALREADY_EXISTS] ${aggregate.id}`,
      );
    }

    throw error;
  }
}
