import type { PrismaClient } from "@prisma/client";

/**
 * Transaction surface available to Representative Program
 * governance operations.
 *
 * ARP governance is allowed to use the Program participant /
 * appointment spine together with the canonical Institutional
 * Instrument authority kernel, but gains no unrelated database
 * authority.
 */
export type RepresentativeProgramGovernanceTransactionClient = Pick<
  PrismaClient,
  | "representativeProgramDocketSequence"
  | "representativeProgramParticipant"
  | "representativeProgramStandingTransition"
  | "representativeProgramAppointment"
  | "institutionalInstrument"
  | "instrumentParty"
  | "instrumentAuthority"
  | "domainEvent"
>;

export type RepresentativeProgramGovernanceTransactionRunner = Pick<
  PrismaClient,
  "$transaction"
>;

export async function runRepresentativeProgramGovernanceTransaction<T>(
  client: RepresentativeProgramGovernanceTransactionRunner,
  operation: (
    tx: RepresentativeProgramGovernanceTransactionClient,
  ) => Promise<T>,
): Promise<T> {
  return client.$transaction(
    async (tx: RepresentativeProgramGovernanceTransactionClient) =>
      operation(tx),
  );
}
