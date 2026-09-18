import type {
  SettlementEndpointId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

import type { SettlementEndpointStatus } from "./status";

export const SETTLEMENT_ENDPOINT_KIND = {
  EVM_ERC20: "EVM_ERC20",
} as const;

export type SettlementEndpointKind =
  (typeof SETTLEMENT_ENDPOINT_KIND)[keyof typeof SETTLEMENT_ENDPOINT_KIND];

export type EvmErc20SettlementCoordinates = Readonly<{
  kind: typeof SETTLEMENT_ENDPOINT_KIND.EVM_ERC20;

  chainId: number;

  network: string;

  address: string;

  assetCode: string;

  tokenContractAddress: string;

  tokenDecimals: number;
}>;

export type SettlementEndpointCoordinates =
  EvmErc20SettlementCoordinates;

export type SettlementEndpoint = Readonly<{
  id: SettlementEndpointId;

  reference: string;

  kind: SettlementEndpointKind;

  coordinates: SettlementEndpointCoordinates;

  status: SettlementEndpointStatus;

  metadata: TreasuryAggregateMetadata;
}>;
