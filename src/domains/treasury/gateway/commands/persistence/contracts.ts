import type { TreasuryAggregateType } from "../../events/aggregateTypes";

import type {
  TreasuryActorId,
  TreasuryCommandId,
  TreasuryCorrelationId,
  TreasuryIdempotencyKey,
} from "../../shared/identifiers";

export type TreasuryGatewayCommandReceipt = Readonly<{
  idempotencyKey: TreasuryIdempotencyKey;

  commandId: TreasuryCommandId;

  commandKind: string;

  aggregateType: TreasuryAggregateType;

  aggregateId: string;

  actorId: TreasuryActorId;

  correlationId: TreasuryCorrelationId;

  requestFingerprint: string;

  createdAt: Date;
}>;
