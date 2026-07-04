export const LEGACY_TREASURY_ACTION_APPROVAL_TYPE = {
  GATEWAY_AUTHORIZED: "GATEWAY_AUTHORIZED",
} as const;

export type LegacyTreasuryActionDraft = Readonly<{
  initiatorUserId: string;

  fromUserId: string;

  toUserId: string;

  assetCode: string;

  amountBaseUnits: string;

  intent: "TREASURY";

  approvalType: typeof LEGACY_TREASURY_ACTION_APPROVAL_TYPE.GATEWAY_AUTHORIZED;

  status: "APPROVED";

  idempotencyKey: string;

  metadata: Readonly<{
    source: "TREASURY_GATEWAY";

    gatewayExecutionId: string;

    gatewayExecutionVersion: number;

    gatewayHandoffId: string;

    gatewayProgramId: string;

    gatewayAllocationId: string;

    gatewayInstructionId?: string;

    gatewayExecutionKind: string;

    gatewayApprovalIds: readonly string[];

    gatewayAuthorizedAt: string;

    gatewayCorrelationId: string;

    gatewayCausationId?: string;
  }>;
}>;
