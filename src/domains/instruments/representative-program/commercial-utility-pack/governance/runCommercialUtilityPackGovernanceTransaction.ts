import type {
  PrismaClient,
} from "@prisma/client";

export type CommercialUtilityPackGovernanceTransactionClient =
  Pick<
    PrismaClient,
    | "user"
    | "representativeProgramParticipant"
    | "commercialUtilityPack"
    | "domainEvent"
  >;

export type CommercialUtilityPackGovernanceTransactionRunner =
  Pick<
    PrismaClient,
    "$transaction"
  >;

export async function runCommercialUtilityPackGovernanceTransaction<T>(
  client: CommercialUtilityPackGovernanceTransactionRunner,
  operation: (
    tx: CommercialUtilityPackGovernanceTransactionClient,
  ) => Promise<T>,
): Promise<T> {
  return client.$transaction(
    async (
      tx: CommercialUtilityPackGovernanceTransactionClient,
    ) => operation(tx),
  );
}
