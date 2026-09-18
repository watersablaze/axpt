import type {
  TreasuryCommandContext,
} from "../../shared/commandContext";

import type {
  SettlementEndpointId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type {
  RegisterSettlementEndpoint,
} from "../commands";

export type RegisterSettlementEndpointDurably =
  Readonly<{
    settlementEndpointId: SettlementEndpointId;

    reference: string;

    eventId: TreasuryEventId;

    context: TreasuryCommandContext;

    payload: RegisterSettlementEndpoint["payload"];
  }>;
