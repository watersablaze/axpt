import type {
  TreasuryEventId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { CreateTreasuryTransfer } from "../commands";

export type OriginateTreasuryTransferDurably = Readonly<{
  transferId: TreasuryTransferId;

  reference: string;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  payload: CreateTreasuryTransfer["payload"];
}>;
