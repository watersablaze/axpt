import {
  TREASURY_AGGREGATE_TYPE,
  type TreasuryAggregateType,
} from "@/domains/treasury/gateway/events/aggregateTypes";

import {
  TREASURY_EVENT_TYPE,
  type TreasuryEventType,
} from "@/domains/treasury/gateway/events/eventType";

import type { CommunicationsTransactionClient } from "../shared/databaseTypes";

import {
  COMMUNICATION_REFLECTION_SOURCE_SYSTEM,
  COMMUNICATION_REFLECTION_TYPE,
} from "./reflectionVocabulary";

const TREASURY_AGGREGATE_TYPES = new Set<string>(
  Object.values(TREASURY_AGGREGATE_TYPE),
);

const TREASURY_EVENT_TYPES = new Set<string>(
  Object.values(TREASURY_EVENT_TYPE),
);

export type TreasuryGatewayReflectionProjectionResult = Readonly<{
  sourceEventId: string;

  aggregateType: TreasuryAggregateType;

  aggregateId: string;

  eventType: TreasuryEventType;

  eligibleRoomCount: number;

  createdCount: number;
}>;

function requireTreasuryAggregateType(value: string): TreasuryAggregateType {
  if (!TREASURY_AGGREGATE_TYPES.has(value)) {
    throw new Error(
      `COMMUNICATION_TREASURY_REFLECTION_AGGREGATE_TYPE_INVALID:${value}`,
    );
  }

  return value as TreasuryAggregateType;
}

function requireTreasuryEventType(value: string): TreasuryEventType {
  if (!TREASURY_EVENT_TYPES.has(value)) {
    throw new Error(
      `COMMUNICATION_TREASURY_REFLECTION_EVENT_TYPE_INVALID:${value}`,
    );
  }

  return value as TreasuryEventType;
}

export async function projectTreasuryGatewayEventReflectionsWithClient({
  sourceEventId,
  client,
}: {
  sourceEventId: string;
  client: CommunicationsTransactionClient;
}): Promise<TreasuryGatewayReflectionProjectionResult> {
  const normalizedEventId = sourceEventId.trim();

  if (!normalizedEventId) {
    throw new Error(
      "COMMUNICATION_TREASURY_REFLECTION_SOURCE_EVENT_ID_REQUIRED",
    );
  }

  /*
   * TreasuryGatewayEvent is authoritative source truth.
   *
   * Communications does not infer the event from aggregate state
   * and does not reconstruct it from a human message.
   */
  const sourceEvent = await client.treasuryGatewayEvent.findUnique({
    where: {
      eventId: normalizedEventId,
    },

    select: {
      eventId: true,

      aggregateType: true,

      aggregateId: true,

      eventType: true,

      occurredAt: true,
    },
  });

  if (!sourceEvent) {
    throw new Error(
      `COMMUNICATION_TREASURY_REFLECTION_SOURCE_EVENT_NOT_FOUND:${normalizedEventId}`,
    );
  }

  const aggregateType = requireTreasuryAggregateType(sourceEvent.aggregateType);

  const eventType = requireTreasuryEventType(sourceEvent.eventType);

  /*
   * Scope is granted only by an already-existing
   * CommunicationOperationalLink.
   *
   * This projector must never create institutional scope.
   */
  const eligibleLinks = await client.communicationOperationalLink.findMany({
    where: {
      targetType: "TREASURY_GATEWAY_AGGREGATE",

      targetSubtype: aggregateType,

      targetId: sourceEvent.aggregateId,
    },

    select: {
      roomId: true,
    },

    orderBy: {
      linkedAt: "asc",
    },
  });

  if (eligibleLinks.length === 0) {
    return {
      sourceEventId: sourceEvent.eventId,

      aggregateType,

      aggregateId: sourceEvent.aggregateId,

      eventType,

      eligibleRoomCount: 0,

      createdCount: 0,
    };
  }

  /*
   * Per-room source-event uniqueness is enforced by:
   *
   * @@unique([
   *   operationalRoomId,
   *   sourceSystem,
   *   sourceEventId
   * ])
   *
   * skipDuplicates makes retries and concurrent projection
   * safe without mutating an existing reflection.
   */
  const created = await client.communicationOperationalReflection.createMany({
    data: eligibleLinks.map(({ roomId }) => ({
      operationalRoomId: roomId,

      sourceSystem: COMMUNICATION_REFLECTION_SOURCE_SYSTEM.TREASURY_GATEWAY,

      sourceEventId: sourceEvent.eventId,

      sourceAggregateType: aggregateType,

      sourceAggregateId: sourceEvent.aggregateId,

      sourceEventType: eventType,

      sourceOccurredAt: sourceEvent.occurredAt,

      targetType: "TREASURY_GATEWAY_AGGREGATE",

      targetSubtype: aggregateType,

      targetId: sourceEvent.aggregateId,

      reflectionType: COMMUNICATION_REFLECTION_TYPE.STATE_OBSERVATION,

      reflectionCode: eventType,
    })),

    skipDuplicates: true,
  });

  return {
    sourceEventId: sourceEvent.eventId,

    aggregateType,

    aggregateId: sourceEvent.aggregateId,

    eventType,

    eligibleRoomCount: eligibleLinks.length,

    createdCount: created.count,
  };
}
