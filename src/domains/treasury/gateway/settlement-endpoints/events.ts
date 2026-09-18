import type {
  SettlementEndpointId,
} from "../shared/identifiers";

import type {
  SettlementEndpointCoordinates,
  SettlementEndpointKind,
} from "./contracts";

export type SettlementEndpointRegisteredPayload = Readonly<{
  settlementEndpointId: SettlementEndpointId;

  reference: string;

  kind: SettlementEndpointKind;

  coordinates: SettlementEndpointCoordinates;
}>;
