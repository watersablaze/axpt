import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

import type { TreasuryReconciliationPass } from "../contracts";

import type { TreasuryReconciliationPassRequestedPayload } from "../events";

import type { TreasuryEventType } from "../../events/eventType";

export type PersistedNewTreasuryReconciliationPass = Readonly<{
  aggregate: TreasuryReconciliationPass;

  event: TreasuryEventEnvelope<TreasuryReconciliationPassRequestedPayload>;
}>;

export type PersistedTreasuryReconciliationPassTransition<TPayload> = Readonly<{
  aggregate: TreasuryReconciliationPass;

  event: TreasuryEventEnvelope<TPayload>;
}>;

export type LoadedTreasuryReconciliationPass = Readonly<{
  aggregate: TreasuryReconciliationPass;

  loadedAt: Date;
}>;

export type TreasuryReconciliationPassLifecycleEvent = Readonly<{
  eventId: string;

  sequence: bigint;

  aggregateVersion: number;

  eventType: TreasuryEventType;

  actorId?: string;

  authorityGrantId?: string;

  correlationId: string;

  causationId?: string;

  occurredAt: Date;

  recordedAt: Date;
}>;

export type LoadedTreasuryReconciliationPassLifecycle = Readonly<{
  passId: string;

  events: readonly TreasuryReconciliationPassLifecycleEvent[];

  loadedAt: Date;
}>;
