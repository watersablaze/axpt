import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { loadTreasuryExecutionAuthorizationEvidenceWithClient } from "./loadTreasuryExecutionAuthorizationEvidenceWithClient";

import type { TreasuryExecutionId } from "../../shared/identifiers";

import type { LoadedTreasuryExecutionAuthorizationEvidence } from "./contracts";

export async function loadTreasuryExecutionAuthorizationEvidence(params: {
  executionId: TreasuryExecutionId;

  executionVersion: number;
}): Promise<LoadedTreasuryExecutionAuthorizationEvidence | null> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    loadTreasuryExecutionAuthorizationEvidenceWithClient({
      ...params,

      client: tx,
    }),
  );
}
