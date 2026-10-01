import { PrismaClient } from "@prisma/client";

import {
  resolveInstitutionalInstrumentAccessWithClient,
} from "../../src/domains/instruments/queries/resolveInstitutionalInstrumentAccessWithClient";

const prisma =
  new PrismaClient();

async function main() {
  /*
   * GM currently has zero access grants.
   *
   * The generic resolver must therefore reject:
   * - an empty token
   * - an arbitrary token
   *
   * without mutating access state.
   */

  const empty =
    await resolveInstitutionalInstrumentAccessWithClient({
      client:
        prisma,
      instrumentReference:
        "GM-KENYA-RCF-001",
      token:
        "",
    });

  const arbitrary =
    await resolveInstitutionalInstrumentAccessWithClient({
      client:
        prisma,
      instrumentReference:
        "GM-KENYA-RCF-001",
      token:
        "GM-G2I-INVALID-TOKEN",
    });

  const missingInstrument =
    await resolveInstitutionalInstrumentAccessWithClient({
      client:
        prisma,
      instrumentReference:
        "GM-G2I-NOT-REAL",
      token:
        "GM-G2I-INVALID-TOKEN",
    });

  console.log(
    JSON.stringify(
      {
        empty,
        arbitrary,
        missingInstrument,
      },
      null,
      2,
    ),
  );

  if (
    empty !== null ||
    arbitrary !== null ||
    missingInstrument !== null
  ) {
    throw new Error(
      "[GM_G2I_1_ACCESS_REJECTION_INVALID]",
    );
  }

  console.log(
    "GM_G2I_1_INVALID_ACCESS_REJECTED",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
