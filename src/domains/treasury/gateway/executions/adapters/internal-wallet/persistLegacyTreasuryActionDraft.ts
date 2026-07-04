import type { PrismaClient, TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { assertPersistedLegacyTreasuryActionMatchesDraft } from "./assertPersistedLegacyTreasuryActionMatchesDraft";

import type { LegacyTreasuryActionDraft } from "./contracts";

export async function persistLegacyTreasuryActionDraft(params: {
  draft: LegacyTreasuryActionDraft;

  client?: PrismaClient | TransactionClient;
}) {
  const { draft, client = prisma } = params;

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
