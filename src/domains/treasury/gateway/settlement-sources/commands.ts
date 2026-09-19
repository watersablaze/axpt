import type { TreasuryCommand } from "../shared/commandContext";

import type { SettlementSourceCoordinates } from "./contracts";

export type RegisterSettlementSource = TreasuryCommand<
  Readonly<{
    coordinates: SettlementSourceCoordinates;
  }>
>;
