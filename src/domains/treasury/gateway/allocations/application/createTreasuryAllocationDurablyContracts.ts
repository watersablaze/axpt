import type { CreateTreasuryAllocation } from "../commands";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryAllocationId,
  TreasuryEventId,
} from "../../shared/identifiers";

export type CreateTreasuryAllocationDurably = Readonly<{
  allocationId: TreasuryAllocationId;

  reference: string;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  payload: CreateTreasuryAllocation["payload"];
}>;
