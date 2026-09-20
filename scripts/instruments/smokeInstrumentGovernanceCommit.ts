import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_EVIDENCE_SUBJECT,
  INSTRUMENT_EVIDENCE_TYPE,
} from "../../src/domains/instruments/contracts";
import {
  recordInstrumentEvidenceWithClient,
} from "../../src/domains/instruments/commands/recordInstrumentEvidenceWithClient";
import {
  runInstrumentGovernanceTransaction,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma = new PrismaClient();

const TEST_REFERENCE =
  "DI-K2E-COMMIT-SMOKE-001";

const TEST_TITLE =
  "DI-K2E Governance Commit Smoke";

const EVIDENCE_TITLE =
  "DI-K2E committed governance evidence";

async function main() {
  const gm =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference: "GM-KENYA-RCF-001",
      },
      select: {
        createdByUserId: true,
      },
    });

  if (!gm) {
    throw new Error(
      "[DI_K2E_2_GM_PROVENANCE_SOURCE_NOT_FOUND]",
    );
  }

  const committed =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        const instrument =
          await tx.institutionalInstrument.create({
            data: {
              reference: TEST_REFERENCE,
              kind:
                INSTITUTIONAL_INSTRUMENT_KIND
                  .GENERAL,
              title: TEST_TITLE,
              status:
                INSTITUTIONAL_INSTRUMENT_STATUS
                  .DRAFT,
              currentVersion: 1,
              createdByUserId:
                gm.createdByUserId,
            },
            select: {
              id: true,
              reference: true,
              status: true,
              currentVersion: true,
            },
          });

        const evidence =
          await recordInstrumentEvidenceWithClient({
            client: tx,
            instrumentReference:
              TEST_REFERENCE,
            evidenceType:
              INSTRUMENT_EVIDENCE_TYPE
                .ATTESTATION,
            subjectType:
              INSTRUMENT_EVIDENCE_SUBJECT
                .INSTRUMENT,
            title:
              EVIDENCE_TITLE,
            metadata: {
              testOnly: true,
              checkpoint: "DI-K2E.2",
            },
            recordedByUserId:
              gm.createdByUserId,
          });

        const eventCount =
          await tx.domainEvent.count({
            where: {
              streamId: instrument.id,
              eventType:
                "INSTRUMENT_EVIDENCE_RECORDED",
            },
          });

        if (eventCount !== 1) {
          throw new Error(
            "[DI_K2E_2_EVENT_NOT_VISIBLE_INSIDE_TRANSACTION]",
          );
        }

        console.log(
          JSON.stringify(
            {
              insideTransaction: {
                instrument,
                evidenceId:
                  evidence.evidence.id,
                eventCount,
              },
            },
            null,
            2,
          ),
        );

        return {
          instrumentId:
            instrument.id,
          evidenceId:
            evidence.evidence.id,
        };
      },
    );

  console.log(
    "DI_K2E_2_TRANSACTION_COMMITTED",
  );

  const durableInstrument =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference: TEST_REFERENCE,
      },
      select: {
        id: true,
        reference: true,
        title: true,
        status: true,
        currentVersion: true,
      },
    });

  const durableEvidence =
    await prisma.instrumentEvidence.findUnique({
      where: {
        id: committed.evidenceId,
      },
      select: {
        id: true,
        instrumentId: true,
        title: true,
        evidenceType: true,
        subjectType: true,
      },
    });

  const durableEvents =
    await prisma.domainEvent.count({
      where: {
        streamId:
          committed.instrumentId,
        eventType:
          "INSTRUMENT_EVIDENCE_RECORDED",
      },
    });

  console.log(
    JSON.stringify(
      {
        durable: {
          instrument:
            durableInstrument,
          evidence:
            durableEvidence,
          evidenceEvents:
            durableEvents,
        },
      },
      null,
      2,
    ),
  );

  if (!durableInstrument) {
    throw new Error(
      "[DI_K2E_2_INSTRUMENT_NOT_DURABLE]",
    );
  }

  if (!durableEvidence) {
    throw new Error(
      "[DI_K2E_2_EVIDENCE_NOT_DURABLE]",
    );
  }

  if (durableEvents !== 1) {
    throw new Error(
      "[DI_K2E_2_EVENT_NOT_DURABLE]",
    );
  }

  console.log(
    "DI_K2E_2_BUSINESS_RECORD_COMMITTED",
  );

  console.log(
    "DI_K2E_2_DOMAIN_EVENT_COMMITTED",
  );

  console.log(
    "DI_K2E_2_TRANSACTION_BOUNDARY_COMMIT_VALID",
  );

  /*
   * Cleanup is intentionally a second transaction.
   *
   * The first transaction must be observed as durably
   * committed before cleanup begins.
   */
  await runInstrumentGovernanceTransaction(
    prisma,
    async (tx) => {
      await tx.domainEvent.deleteMany({
        where: {
          streamId:
            committed.instrumentId,
        },
      });

      await tx.institutionalInstrument.delete({
        where: {
          id: committed.instrumentId,
        },
      });
    },
  );

  console.log(
    "DI_K2E_2_CLEANUP_TRANSACTION_COMMITTED",
  );

  const [
    survivingInstrument,
    survivingEvidence,
    survivingEvents,
  ] = await Promise.all([
    prisma.institutionalInstrument.count({
      where: {
        reference: TEST_REFERENCE,
      },
    }),
    prisma.instrumentEvidence.count({
      where: {
        instrumentId:
          committed.instrumentId,
      },
    }),
    prisma.domainEvent.count({
      where: {
        streamId:
          committed.instrumentId,
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        cleanup: {
          survivingInstrument,
          survivingEvidence,
          survivingEvents,
        },
      },
      null,
      2,
    ),
  );

  if (
    survivingInstrument !== 0 ||
    survivingEvidence !== 0 ||
    survivingEvents !== 0
  ) {
    throw new Error(
      "[DI_K2E_2_CLEANUP_INCOMPLETE]",
    );
  }

  console.log(
    "DI_K2E_2_TEST_ARTIFACTS_REMOVED",
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
