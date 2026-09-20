import type { PrismaClient } from "@prisma/client";

/**
 * The database delegates available to instrument-governance
 * operations inside one atomic transaction.
 *
 * Keep this surface explicit. Governance commands should not
 * gain unrelated database authority merely because they run
 * inside a Prisma transaction.
 */
export type InstrumentGovernanceTransactionClient = Pick<
  PrismaClient,
  | "institutionalInstrument"
  | "instrumentVersion"
  | "instrumentProposition"
  | "instrumentResponse"
  | "instrumentParty"
  | "instrumentAccessGrant"
  | "instrumentAuthority"
  | "instrumentStateTransition"
  | "instrumentEvidence"
  | "instrumentRelation"
  | "user"
  | "domainEvent"
>;

export type InstrumentGovernanceTransactionRunner =
  Pick<PrismaClient, "$transaction">;

/**
 * Establishes one atomic boundary for an institutional
 * governance act.
 *
 * Low-level WithClient commands remain transaction-agnostic
 * and consume only the delegates they require.
 */
export async function runInstrumentGovernanceTransaction<T>(
  client: InstrumentGovernanceTransactionRunner,
  operation: (
    tx: InstrumentGovernanceTransactionClient,
  ) => Promise<T>,
): Promise<T> {
  return client.$transaction(
    async (
      tx: InstrumentGovernanceTransactionClient,
    ) => {
      return operation(tx);
    },
  );
}
