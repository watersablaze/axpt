import { PrismaClient } from "@prisma/client";

import {
  INSTRUMENT_RESOLUTION_STATE,
} from "../../src/domains/instruments/contracts";
import {
  loadInstrumentDeliberationWithClient,
} from "../../src/domains/instruments/queries/loadInstrumentDeliberationWithClient";

const prisma =
  new PrismaClient();

async function main() {
  const gm =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference:
          "GM-KENYA-RCF-001",
      },
      select: {
        createdByUserId: true,
      },
    });

  if (!gm) {
    throw new Error(
      "[GM_G2G_GM_INSTRUMENT_NOT_FOUND]",
    );
  }

  const readModel =
    await loadInstrumentDeliberationWithClient({
      client:
        prisma,
      instrumentReference:
        "GM-KENYA-RCF-001",
      /*
       * Test-only reader identity.
       *
       * GM currently has no external response actor,
       * so the creator is used only to prove that
       * the read model derives the empty baseline
       * without writing anything.
       */
      actorUserId:
        gm.createdByUserId,
    });

  if (!readModel) {
    throw new Error(
      "[GM_G2G_READ_MODEL_NOT_FOUND]",
    );
  }

  console.log(
    JSON.stringify(
      readModel,
      null,
      2,
    ),
  );

  if (
    readModel.instrument.reference !==
      "GM-KENYA-RCF-001"
  ) {
    throw new Error(
      "[GM_G2G_REFERENCE_MISMATCH]",
    );
  }

  if (
    readModel.version.number !== 1 ||
    readModel.instrument.currentVersion !== 1
  ) {
    throw new Error(
      "[GM_G2G_VERSION_MISMATCH]",
    );
  }

  if (
    readModel.propositions.length !== 8
  ) {
    throw new Error(
      `[GM_G2G_PROPOSITION_COUNT_UNEXPECTED] ${readModel.propositions.length}`,
    );
  }

  if (
    readModel.summary.total !== 8 ||
    readModel.summary.responded !== 0 ||
    readModel.summary.unresponded !== 8 ||
    readModel.summary.aligned !== 0 ||
    readModel.summary.received !== 0 ||
    readModel.summary.clarificationOpen !== 0 ||
    readModel.summary.revisionPending !== 0 ||
    readModel.summary.notAligned !== 0
  ) {
    throw new Error(
      "[GM_G2G_SUMMARY_BASELINE_INVALID]",
    );
  }

  const invalidResolution =
    readModel.propositions.find(
      (item) =>
        item.resolution !==
        INSTRUMENT_RESOLUTION_STATE
          .UNRESPONDED,
    );

  if (invalidResolution) {
    throw new Error(
      `[GM_G2G_UNEXPECTED_RESOLUTION] ${invalidResolution.reference}: ${invalidResolution.resolution}`,
    );
  }

  const references =
    readModel.propositions.map(
      (item) =>
        item.reference,
    );

  const expectedReferences = [
    "REL-01",
    "REL-02",
    "AUTH-01",
    "AUTH-02",
    "PASS-01",
    "PASS-02",
    "FUT-01",
    "FUT-02",
  ];

  if (
    JSON.stringify(references) !==
    JSON.stringify(expectedReferences)
  ) {
    throw new Error(
      `[GM_G2G_PROPOSITION_ORDER_INVALID] ${JSON.stringify(references)}`,
    );
  }

  console.log(
    "GM_G2G_READ_MODEL_BASELINE_VALID",
  );

  console.log(
    "GM_G2G_ALL_PROPOSITIONS_UNRESPONDED",
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
