import type {
  TreasuryActorId,
  TreasuryAuthorityGrantId,
  TreasuryCausationId,
  TreasuryCorrelationId,
  TreasuryEventId,
} from "../shared/identifiers";

import type { TreasuryAggregateType } from "./aggregateTypes";

import type { TreasuryEventType } from "./eventType";

export type TreasuryEventEnvelope<TPayload> = Readonly<{
  eventId: TreasuryEventId;

  sequence: bigint;

  aggregateType: TreasuryAggregateType;

  aggregateId: string;

  aggregateVersion: number;

  eventType: TreasuryEventType;

  actorId?: TreasuryActorId;

  authorityGrantId?: TreasuryAuthorityGrantId;

  correlationId: TreasuryCorrelationId;

  causationId?: TreasuryCausationId;

  payload: Readonly<TPayload>;

  occurredAt: Date;

  recordedAt: Date;

  previousEventHash?: string;

  eventHash?: string;
}>;
