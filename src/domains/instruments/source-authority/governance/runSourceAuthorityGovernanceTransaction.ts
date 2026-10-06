import type { PrismaClient } from "@prisma/client";

/**
 * Explicit database authority for one Source Authority
 * governance transaction.
 *
 * Do not widen the generic InstrumentGovernanceTransaction
 * surface merely because Source Authority exists.
 */
export type SourceAuthorityGovernanceTransactionClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityRecord"
    | "sourceAuthorityAssertion"
    | "sourceAuthorityCapability"
    | "sourceAuthorityRecognition"
    | "sourceAuthorityRecognitionEvidence"
    | "sourceAuthorityEvidenceAdmission"
    | "instrumentEvidence"
    | "domainEvent"
  >;

export type SourceAuthorityGovernanceTransactionRunner =
  Pick<PrismaClient, "$transaction">;

export async function runSourceAuthorityGovernanceTransaction<T>(
  client: SourceAuthorityGovernanceTransactionRunner,
  operation: (
    tx: SourceAuthorityGovernanceTransactionClient,
  ) => Promise<T>,
  options?: { timeoutMs?: number },
): Promise<T> {
  return client.$transaction(
    async (
      tx: SourceAuthorityGovernanceTransactionClient,
    ) => operation(tx),
    options?.timeoutMs
      ? { timeout: options.timeoutMs }
      : undefined,
  );
}
