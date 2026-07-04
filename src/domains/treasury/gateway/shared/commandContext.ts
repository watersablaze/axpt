import type {
  TreasuryActorId,
  TreasuryAuthorityGrantId,
  TreasuryCausationId,
  TreasuryCommandId,
  TreasuryCorrelationId,
  TreasuryIdempotencyKey,
} from "./identifiers";

export type TreasuryCommandContext = Readonly<{
  commandId: TreasuryCommandId;

  actorId: TreasuryActorId;

  authorityGrantId?: TreasuryAuthorityGrantId;

  correlationId: TreasuryCorrelationId;

  causationId?: TreasuryCausationId;

  requestedAt: Date;

  idempotencyKey: TreasuryIdempotencyKey;
}>;

export type TreasuryCommand<TPayload> = Readonly<{
  context: TreasuryCommandContext;

  payload: TPayload;
}>;
