import type {
  SettlementSourceId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

import type { SettlementSourceStatus } from "./status";

export const SETTLEMENT_SOURCE_KIND = {
  EVM_ACCOUNT: "EVM_ACCOUNT",
} as const;

export type SettlementSourceKind =
  (typeof SETTLEMENT_SOURCE_KIND)[keyof typeof SETTLEMENT_SOURCE_KIND];

export type EvmAccountSettlementSourceCoordinates =
  Readonly<{
    kind:
      typeof SETTLEMENT_SOURCE_KIND.EVM_ACCOUNT;

    chainId: number;

    network: string;

    address: string;
  }>;

export type SettlementSourceCoordinates =
  EvmAccountSettlementSourceCoordinates;

export type SettlementSource = Readonly<{
  id: SettlementSourceId;

  reference: string;

  kind: SettlementSourceKind;

  coordinates: SettlementSourceCoordinates;

  status: SettlementSourceStatus;

  metadata: TreasuryAggregateMetadata;
}>;
