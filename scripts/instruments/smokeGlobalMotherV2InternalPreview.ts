import {
  PrismaClient,
} from "@prisma/client";

import {
  loadInstrumentDeliberationWithClient,
} from "../../src/domains/instruments/queries/loadInstrumentDeliberationWithClient";

const prisma =
  new PrismaClient();

const GM_REFERENCE =
  "GM-KENYA-RCF-001";

async function main() {
  const defaultProjection =
    await loadInstrumentDeliberationWithClient({
      client:
        prisma,
      instrumentReference:
        GM_REFERENCE,
      actorUserId:
        null,
    });

  if (!defaultProjection) {
    throw new Error(
      "GM_G2M_5B_DEFAULT_PROJECTION_MISSING",
    );
  }

  if (
    defaultProjection.instrument.currentVersion !==
      1 ||
    defaultProjection.version.number !==
      1 ||
    defaultProjection.version.status !==
      "ISSUED" ||
    defaultProjection.propositions.length !==
      8
  ) {
    throw new Error(
      "GM_G2M_5B_DEFAULT_PROJECTION_CHANGED",
    );
  }

  console.log(
    "GM_G2M_5B_DEFAULT_CURRENT_VERSION_PRESERVED",
  );

  const previewProjection =
    await loadInstrumentDeliberationWithClient({
      client:
        prisma,
      instrumentReference:
        GM_REFERENCE,
      actorUserId:
        null,
      versionNumber:
        2,
    });

  if (!previewProjection) {
    throw new Error(
      "GM_G2M_5B_V2_PREVIEW_PROJECTION_MISSING",
    );
  }

  const references =
    previewProjection.propositions.map(
      proposition =>
        proposition.reference,
    );

  const expectedReferences = [
    "REL-01",
    "REL-02",
    "AUTH-01",
    "AUTH-02",
    "AUTH-03",
    "PASS-01",
    "PASS-02",
    "CONT-01",
    "CONT-02",
    "CONT-03",
    "INST-01",
    "INST-02",
  ];

  if (
    previewProjection.instrument.currentVersion !==
      1 ||
    previewProjection.version.number !==
      2 ||
    previewProjection.version.status !==
      "DRAFT" ||
    previewProjection.propositions.length !==
      12 ||
    previewProjection.actorUserId !==
      null ||
    previewProjection.summary.responded !==
      0 ||
    JSON.stringify(references) !==
      JSON.stringify(expectedReferences)
  ) {
    throw new Error(
      "GM_G2M_5B_V2_PREVIEW_PROJECTION_INVALID",
    );
  }

  console.log(
    "GM_G2M_5B_V2_DRAFT_PROJECTED_READ_ONLY",
  );

  console.log(
    "GM_G2M_5B_OPERATIVE_VERSION_REMAINS_V1",
  );

  console.log(
    JSON.stringify(
      {
        instrumentCurrentVersion:
          previewProjection.instrument.currentVersion,
        projectedVersion:
          previewProjection.version.number,
        projectedStatus:
          previewProjection.version.status,
        propositionCount:
          previewProjection.propositions.length,
        responded:
          previewProjection.summary.responded,
        actorUserId:
          previewProjection.actorUserId,
        references,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
