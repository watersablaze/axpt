import type { PrismaClient } from "@prisma/client";

import {
  REPRESENTATIVE_PROGRAM_DOCKET_FAMILY,
  REPRESENTATIVE_PROGRAM_DOCKET_PREFIX,
} from "../contracts";

export type RepresentativeProgramDocketAllocationClient = Pick<
  PrismaClient,
  "representativeProgramDocketSequence"
>;

export async function allocateRepresentativeProgramDocketWithClient(params: {
  client: RepresentativeProgramDocketAllocationClient;
  year: number;
}): Promise<string> {
  if (!Number.isInteger(params.year) || params.year < 2000 || params.year > 9999) {
    throw new Error(`[ARP_DOCKET_INVALID_YEAR] ${params.year}`);
  }

  const sequence =
    await params.client.representativeProgramDocketSequence.upsert({
      where: {
        year: params.year,
      },
      create: {
        year: params.year,
        nextNumber: 2,
      },
      update: {
        nextNumber: {
          increment: 1,
        },
      },
      select: {
        nextNumber: true,
      },
    });

  const allocatedNumber = sequence.nextNumber - 1;

  if (allocatedNumber < 1 || allocatedNumber > 999) {
    throw new Error(
      `[ARP_DOCKET_SEQUENCE_EXHAUSTED] year=${params.year} number=${allocatedNumber}`,
    );
  }

  const yy = String(params.year % 100).padStart(2, "0");
  const nnn = String(allocatedNumber).padStart(3, "0");

  return `${REPRESENTATIVE_PROGRAM_DOCKET_PREFIX}-${yy}-${REPRESENTATIVE_PROGRAM_DOCKET_FAMILY}-${nnn}`;
}
