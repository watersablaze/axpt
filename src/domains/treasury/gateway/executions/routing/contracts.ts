import type {
  SettlementEndpointId,
  TreasuryExecutionHandoffId,
  TreasuryExecutionId,
} from "../../shared/identifiers";

export const TREASURY_EXECUTION_ADAPTER_KIND = {
  INTERNAL_WALLET: "INTERNAL_WALLET",

  EXTERNAL_SETTLEMENT_RAIL: "EXTERNAL_SETTLEMENT_RAIL",

  MANUAL_TREASURY_OPERATION: "MANUAL_TREASURY_OPERATION",
} as const;

export type TreasuryExecutionAdapterKind =
  (typeof TREASURY_EXECUTION_ADAPTER_KIND)[keyof typeof TREASURY_EXECUTION_ADAPTER_KIND];

export type InternalWalletCapability = Readonly<{
  kind: typeof TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET;

  settlementEndpointId: SettlementEndpointId;

  fromUserId: string;

  toUserId: string;

  assetCode: string;
}>;

export type ExternalSettlementRailCapability = Readonly<{
  kind: typeof TREASURY_EXECUTION_ADAPTER_KIND.EXTERNAL_SETTLEMENT_RAIL;

  settlementEndpointId: SettlementEndpointId;

  railCode: string;
}>;

export type ManualTreasuryOperationCapability = Readonly<{
  kind: typeof TREASURY_EXECUTION_ADAPTER_KIND.MANUAL_TREASURY_OPERATION;

  settlementEndpointId: SettlementEndpointId;

  operationCode?: string;
}>;

export type TreasurySettlementCapability =
  | InternalWalletCapability
  | ExternalSettlementRailCapability
  | ManualTreasuryOperationCapability;

export type ResolvedTreasuryExecutionRoute = Readonly<{
  status: "RESOLVED";

  handoffId: TreasuryExecutionHandoffId;

  executionId: TreasuryExecutionId;

  adapterKind: TreasuryExecutionAdapterKind;

  capability: TreasurySettlementCapability;
}>;

export type UnresolvedTreasuryExecutionRoute = Readonly<{
  status: "UNRESOLVED";

  handoffId: TreasuryExecutionHandoffId;

  executionId: TreasuryExecutionId;

  reason: string;
}>;

export type TreasuryExecutionRouteResolution =
  | ResolvedTreasuryExecutionRoute
  | UnresolvedTreasuryExecutionRoute;
