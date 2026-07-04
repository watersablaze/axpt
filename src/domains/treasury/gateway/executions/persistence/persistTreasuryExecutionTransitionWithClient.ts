import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { TreasuryExecution } from "../contracts";

import type { PersistedTreasuryExecutionTransition } from "./contracts";

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export async function persistTreasuryExecutionTransitionWithClient<
  TPayload,
>(params: {
  expectedVersion: number;

  result: TreasuryDomainResult<TreasuryExecution, TPayload>;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<PersistedTreasuryExecutionTransition<TPayload>> {
  const { expectedVersion, result, eventId, context, client } = params;

  const { aggregate, event } = result;

  const nextVersion = aggregate.metadata.version;

  if (nextVersion !== expectedVersion + 1) {
    throw new Error(
      `[TREASURY_GATEWAY_AGGREGATE_VERSION_STEP_INVALID] expected ${expectedVersion + 1}, received ${nextVersion}`,
    );
  }

  const updated = await client.treasuryGatewayAggregate.updateMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: aggregate.id,

      version: expectedVersion,
    },

    data: {
      version: nextVersion,

      status: aggregate.status,

      snapshot: toJsonValue(aggregate),
    },
  });

  if (updated.count !== 1) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_CONCURRENCY_CONFLICT] ${aggregate.id}@${expectedVersion}`,
    );
  }

  const persistedEvent = await client.treasuryGatewayEvent.create({
    data: {
      eventId,

      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: aggregate.id,

      aggregateVersion: nextVersion,

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

      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: aggregate.id,

      aggregateVersion: nextVersion,

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
}
