import type { PrismaClient, TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { persistLegacyTreasuryActionDraftWithClient } from "./persistLegacyTreasuryActionDraftWithClient";

import type { LegacyTreasuryActionDraft } from "./contracts";

export async function persistLegacyTreasuryActionDraft(params: {
  draft: LegacyTreasuryActionDraft;

  client?: PrismaClient | TransactionClient;
}) {
  const { draft, client = prisma } = params;

  return persistLegacyTreasuryActionDraftWithClient({
    draft,
    client,
  });
}
