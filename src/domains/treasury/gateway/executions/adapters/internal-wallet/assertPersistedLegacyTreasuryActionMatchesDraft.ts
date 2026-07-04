import type { LegacyTreasuryActionDraft } from "./contracts";

export type PersistedLegacyTreasuryActionIdentity = Readonly<{
  initiatorUserId: string;

  fromUserId: string;

  toUserId: string;

  assetCode: string;

  amountBaseUnits:
    | string
    | Readonly<{
        toString(): string;
      }>;

  intent: string;

  approvalType: string;

  idempotencyKey: string;

  metadata: unknown;
}>;

function getMetadataRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function assertPersistedLegacyTreasuryActionMatchesDraft(
  persisted: PersistedLegacyTreasuryActionIdentity,

  draft: LegacyTreasuryActionDraft,
): void {
  const persistedAmount = persisted.amountBaseUnits.toString();

  const metadata = getMetadataRecord(persisted.metadata);

  const mismatches: string[] = [];

  if (persisted.initiatorUserId !== draft.initiatorUserId) {
    mismatches.push("initiatorUserId");
  }

  if (persisted.fromUserId !== draft.fromUserId) {
    mismatches.push("fromUserId");
  }

  if (persisted.toUserId !== draft.toUserId) {
    mismatches.push("toUserId");
  }

  if (persisted.assetCode !== draft.assetCode) {
    mismatches.push("assetCode");
  }

  if (persistedAmount !== draft.amountBaseUnits) {
    mismatches.push("amountBaseUnits");
  }

  if (persisted.intent !== draft.intent) {
    mismatches.push("intent");
  }

  if (persisted.approvalType !== draft.approvalType) {
    mismatches.push("approvalType");
  }

  if (persisted.idempotencyKey !== draft.idempotencyKey) {
    mismatches.push("idempotencyKey");
  }

  if (metadata?.source !== draft.metadata.source) {
    mismatches.push("metadata.source");
  }

  if (metadata?.gatewayExecutionId !== draft.metadata.gatewayExecutionId) {
    mismatches.push("metadata.gatewayExecutionId");
  }

  if (metadata?.gatewayHandoffId !== draft.metadata.gatewayHandoffId) {
    mismatches.push("metadata.gatewayHandoffId");
  }

  if (mismatches.length > 0) {
    throw new Error(
      `[TREASURY_GATEWAY_LEGACY_ACTION_IDEMPOTENCY_COLLISION] ${mismatches.join(",")}`,
    );
  }
}
