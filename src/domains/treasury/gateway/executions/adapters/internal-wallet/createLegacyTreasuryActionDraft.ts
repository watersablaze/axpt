import { ASSET_REGISTRY, type AssetCode } from "@/lib/assets/registry";

import { parseDisplayToBaseUnits } from "@/lib/money/baseUnits";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../../routing/contracts";

import { LEGACY_TREASURY_ACTION_APPROVAL_TYPE } from "./contracts";

import type { ResolvedTreasuryExecutionRoute } from "../../routing/contracts";

import type { TreasuryExecutionHandoff } from "../../handoff/contracts";

import type { LegacyTreasuryActionDraft } from "./contracts";

function isAssetCode(value: string): value is AssetCode {
  return value in ASSET_REGISTRY;
}

export function createLegacyTreasuryActionDraft(params: {
  handoff: TreasuryExecutionHandoff;

  route: ResolvedTreasuryExecutionRoute;
}): LegacyTreasuryActionDraft {
  const { handoff, route } = params;

  if (route.handoffId !== handoff.id) {
    throw new Error(
      `[TREASURY_GATEWAY_ROUTE_HANDOFF_MISMATCH] ${route.handoffId} -> ${handoff.id}`,
    );
  }

  if (route.executionId !== handoff.executionId) {
    throw new Error(
      `[TREASURY_GATEWAY_ROUTE_EXECUTION_MISMATCH] ${route.executionId} -> ${handoff.executionId}`,
    );
  }

  if (route.adapterKind !== TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_ROUTE_REQUIRED] ${route.adapterKind}`,
    );
  }

  if (
    route.capability.kind !== TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_CAPABILITY_REQUIRED] ${route.capability.kind}`,
    );
  }

  const { capability } = route;

  if (handoff.amount.currency !== capability.assetCode) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_ASSET_MISMATCH] ${handoff.amount.currency} -> ${capability.assetCode}`,
    );
  }

  if (!isAssetCode(capability.assetCode)) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_ASSET_UNSUPPORTED] ${capability.assetCode}`,
    );
  }

  const asset = ASSET_REGISTRY[capability.assetCode];

  if (asset.status !== "ACTIVE") {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_ASSET_INACTIVE] ${asset.code}`,
    );
  }

  const amountBaseUnits = parseDisplayToBaseUnits(
    handoff.amount.amount,
    asset.decimals,
  );

  if (amountBaseUnits <= 0n) {
    throw new Error("[TREASURY_GATEWAY_INTERNAL_WALLET_AMOUNT_NOT_POSITIVE]");
  }

  return {
    initiatorUserId: capability.operationalInitiatorUserId,

    fromUserId: capability.fromUserId,

    toUserId: capability.toUserId,

    assetCode: asset.code,

    amountBaseUnits: amountBaseUnits.toString(),

    intent: "TREASURY",

    approvalType: LEGACY_TREASURY_ACTION_APPROVAL_TYPE.GATEWAY_AUTHORIZED,

    status: "APPROVED",

    idempotencyKey: handoff.context.idempotencyKey,

    metadata: {
      source: "TREASURY_GATEWAY",

      gatewayExecutionId: handoff.executionId,

      gatewayExecutionVersion: handoff.executionVersion,

      gatewayHandoffId: handoff.id,

      gatewayProgramId: handoff.programId,

      gatewayAllocationId: handoff.allocationId,

      gatewayInstructionId: handoff.instructionId,

      gatewayExecutionKind: handoff.kind,

      gatewayApprovalIds: handoff.authorization.approvalIds,

      gatewayAuthorizedAt: handoff.authorization.authorizedAt.toISOString(),

      gatewayCorrelationId: handoff.context.correlationId,

      gatewayCausationId: handoff.context.causationId,
    },
  };
}
