import type {
  TreasuryCommandContext,
} from "../../shared/commandContext";

import type {
  SettlementSourceId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type {
  RegisterSettlementSource,
} from "../commands";

export type RegisterSettlementSourceDurably =
  Readonly<{
    settlementSourceId:
      SettlementSourceId;

    reference: string;

    eventId: TreasuryEventId;

    context: TreasuryCommandContext;

    payload:
      RegisterSettlementSource["payload"];
  }>;
