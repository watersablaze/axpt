import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { loadTreasuryExecutionDispatchOwnershipEvidenceWithClient } from "./loadTreasuryExecutionDispatchOwnershipEvidenceWithClient";

import type { TreasuryExecutionId } from "../../shared/identifiers";

import type { LoadedTreasuryExecutionDispatchOwnershipEvidence } from "./contracts";

export async function loadTreasuryExecutionDispatchOwnershipEvidence(params: {
  executionId: TreasuryExecutionId;

  executionVersion: number;
}): Promise<LoadedTreasuryExecutionDispatchOwnershipEvidence | null> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
      ...params,

      client: tx,
    }),
  );
}
