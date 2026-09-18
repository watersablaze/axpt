import type { TreasuryCommand } from "../shared/commandContext";

import type { SettlementEndpointCoordinates } from "./contracts";

export type RegisterSettlementEndpoint = TreasuryCommand<
  Readonly<{
    coordinates: SettlementEndpointCoordinates;
  }>
>;
