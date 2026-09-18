import {
  SETTLEMENT_ENDPOINT_KIND,
  type SettlementEndpoint,
} from "../../settlement-endpoints/contracts";

import {
  SETTLEMENT_ENDPOINT_STATUS,
} from "../../settlement-endpoints/status";

import {
  TREASURY_EXECUTION_ADAPTER_KIND,
  TREASURY_EXTERNAL_SETTLEMENT_RAIL_CODE,
  type ExternalSettlementRailCapability,
} from "./contracts";

export function deriveExternalSettlementRailCapability(
  endpoint: SettlementEndpoint,
): ExternalSettlementRailCapability {
  if (
    endpoint.status !==
    SETTLEMENT_ENDPOINT_STATUS.ACTIVE
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_NOT_ACTIVE] ${endpoint.id}:${endpoint.status}`,
    );
  }

  if (
    endpoint.kind !==
    SETTLEMENT_ENDPOINT_KIND.EVM_ERC20
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_KIND_UNSUPPORTED_FOR_EXTERNAL_RAIL] ${endpoint.kind}`,
    );
  }

  /*
   * Deliberate nominal-authority handoff.
   *
   * ExternalSettlementRailCapability cannot be created
   * structurally because its brand is private to the
   * routing contract module.
   *
   * This function is the governed constructor boundary.
   */
  return {
    kind:
      TREASURY_EXECUTION_ADAPTER_KIND.EXTERNAL_SETTLEMENT_RAIL,

    settlementEndpointId: endpoint.id,

    railCode:
      TREASURY_EXTERNAL_SETTLEMENT_RAIL_CODE.EVM_ERC20,
  } as ExternalSettlementRailCapability;
}
