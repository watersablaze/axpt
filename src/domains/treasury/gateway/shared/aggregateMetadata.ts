import type { TreasuryActorId } from "./identifiers";

export type TreasuryAggregateMetadata = Readonly<{
  createdAt: Date;

  updatedAt: Date;

  createdByActorId: TreasuryActorId;

  lastModifiedByActorId: TreasuryActorId;

  version: number;
}>;
