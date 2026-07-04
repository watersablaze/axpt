import type { TreasuryExecutionHandoff } from "../handoff/contracts";

import type {
  TreasuryExecutionRouteResolution,
  TreasurySettlementCapability,
} from "./contracts";

export function resolveTreasuryExecutionRoute(params: {
  handoff: TreasuryExecutionHandoff;

  capability?: TreasurySettlementCapability;
}): TreasuryExecutionRouteResolution {
  const { handoff, capability } = params;

  if (!handoff.settlementEndpointId) {
    return {
      status: "UNRESOLVED",

      handoffId: handoff.id,

      executionId: handoff.executionId,

      reason: "SETTLEMENT_ENDPOINT_REQUIRED",
    };
  }

  if (!capability) {
    return {
      status: "UNRESOLVED",

      handoffId: handoff.id,

      executionId: handoff.executionId,

      reason: "SETTLEMENT_CAPABILITY_NOT_FOUND",
    };
  }

  if (capability.settlementEndpointId !== handoff.settlementEndpointId) {
    return {
      status: "UNRESOLVED",

      handoffId: handoff.id,

      executionId: handoff.executionId,

      reason: "SETTLEMENT_CAPABILITY_ENDPOINT_MISMATCH",
    };
  }

  return {
    status: "RESOLVED",

    handoffId: handoff.id,

    executionId: handoff.executionId,

    adapterKind: capability.kind,

    capability,
  };
}
