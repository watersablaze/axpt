import type {
  SettlementSourceId,
} from "../shared/identifiers";

import type {
  SettlementSourceCoordinates,
  SettlementSourceKind,
} from "./contracts";

export type SettlementSourceRegisteredPayload =
  Readonly<{
    settlementSourceId: SettlementSourceId;

    reference: string;

    kind: SettlementSourceKind;

    coordinates: SettlementSourceCoordinates;
  }>;
