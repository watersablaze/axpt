import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import { TREASURY_RECONCILIATION_PASS_STATUS } from "../status";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { TreasuryReconciliationPass } from "../contracts";

import type { TreasuryReconciliationPassRequestedPayload } from "../events";

import type { PersistedNewTreasuryReconciliationPass } from "./contracts";

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export async function persistNewTreasuryReconciliationPassWithClient(params: {
  result: TreasuryDomainResult<
    TreasuryReconciliationPass,
    TreasuryReconciliationPassRequestedPayload
  >;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<PersistedNewTreasuryReconciliationPass> {
  const { result, eventId, context, client } = params;

  const { aggregate, event } = result;

  if (aggregate.metadata.version !== 1) {
    throw new Error(
      `[TREASURY_GATEWAY_NEW_AGGREGATE_VERSION_INVALID] expected 1, received ${aggregate.metadata.version}`,
    );
  }

  if (aggregate.status !== TREASURY_RECONCILIATION_PASS_STATUS.REQUESTED) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_NEW_STATUS_INVALID] ${aggregate.status}`,
    );
  }

  if (
    event.eventType !==
    TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_REQUESTED
  ) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_NEW_EVENT_INVALID] ${event.eventType}`,
    );
  }

  if (event.payload.passId !== aggregate.id) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_EVENT_TARGET_MISMATCH] ${event.payload.passId} -> ${aggregate.id}`,
    );
  }

  await client.treasuryGatewayAggregate.create({
    data: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,

      aggregateId: aggregate.id,

      version: aggregate.metadata.version,

      status: aggregate.status,

      snapshot: toJsonValue(aggregate),
    },
  });

  const persistedEvent = await client.treasuryGatewayEvent.create({
    data: {
      eventId,

      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,

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

      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,

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
}
