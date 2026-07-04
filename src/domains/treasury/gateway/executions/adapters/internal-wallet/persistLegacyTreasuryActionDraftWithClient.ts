import type { PrismaClient, TransactionClient } from "@prisma/client";

import { assertPersistedLegacyTreasuryActionMatchesDraft } from "./assertPersistedLegacyTreasuryActionMatchesDraft";

import type { LegacyTreasuryActionDraft } from "./contracts";

export type LegacyTreasuryActionPersistenceClient =
  | PrismaClient
  | TransactionClient;

export async function persistLegacyTreasuryActionDraftWithClient(params: {
  draft: LegacyTreasuryActionDraft;

  client: LegacyTreasuryActionPersistenceClient;
}) {
  const { draft, client } = params;

  const metadata = {
    ...draft.metadata,

    gatewayApprovalIds: [...draft.metadata.gatewayApprovalIds],
  };

  const persisted = await client.treasuryAction.upsert({
    where: {
      idempotencyKey: draft.idempotencyKey,
    },

    update: {},

    create: {
      initiatorUserId: draft.initiatorUserId,

      fromUserId: draft.fromUserId,

      toUserId: draft.toUserId,

      assetCode: draft.assetCode,

      amountBaseUnits: draft.amountBaseUnits,

      intent: draft.intent,

      approvalType: draft.approvalType,

      status: draft.status,

      idempotencyKey: draft.idempotencyKey,

      metadata,
    },
  });

  assertPersistedLegacyTreasuryActionMatchesDraft(persisted, draft);

  return persisted;
}
