import { PrismaClient } from "@prisma/client";

import {
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

const GM_REFERENCE = "GM-KENYA-RCF-001";

const SMOKE_TITLE =
  "DI-K2E transactional rollback smoke";

const ROLLBACK_SENTINEL =
  "DI_K2E_1B_INTENTIONAL_ROLLBACK";

async function main() {
  const gm =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference: GM_REFERENCE,
      },
      select: {
        id: true,
        reference: true,
        status: true,
        currentVersion: true,
        createdByUserId: true,
      },
    });

  if (!gm) {
    throw new Error(
      "[DI_K2E_1B_GM_INSTRUMENT_NOT_FOUND]",
    );
  }

  const beforeEvidence =
    await prisma.instrumentEvidence.count({
      where: {
        instrumentId: gm.id,
      },
    });

  const beforeEvents =
    await prisma.domainEvent.count({
      where: {
        streamId: gm.id,
        eventType:
          "INSTRUMENT_EVIDENCE_RECORDED",
      },
    });

  console.log(
    JSON.stringify(
      {
        before: {
          evidenceCount: beforeEvidence,
          evidenceEventCount: beforeEvents,
          status: gm.status,
          currentVersion: gm.currentVersion,
        },
      },
      null,
      2,
    ),
  );

  try {
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        const result =
          await recordInstrumentEvidenceWithClient({
            client: tx,
            instrumentReference:
              GM_REFERENCE,
            evidenceType:
              INSTRUMENT_EVIDENCE_TYPE
                .ATTESTATION,
            subjectType:
              INSTRUMENT_EVIDENCE_SUBJECT
                .INSTRUMENT,
            title: SMOKE_TITLE,
            metadata: {
              testOnly: true,
              checkpoint: "DI-K2E.1B",
            },
            recordedByUserId:
              gm.createdByUserId,
          });

        const insideEvidence =
          await tx.instrumentEvidence.count({
            where: {
              id: result.evidence.id,
            },
          });

        const insideEvents =
          await tx.domainEvent.count({
            where: {
              streamId: gm.id,
              eventType:
                "INSTRUMENT_EVIDENCE_RECORDED",
            },
          });

        console.log(
          JSON.stringify(
            {
              insideTransaction: {
                evidenceId:
                  result.evidence.id,
                evidenceVisible:
                  insideEvidence,
                evidenceEventCount:
                  insideEvents,
              },
            },
            null,
            2,
          ),
        );

        if (insideEvidence !== 1) {
          throw new Error(
            "[DI_K2E_1B_EVIDENCE_NOT_VISIBLE_INSIDE_TRANSACTION]",
          );
        }

        if (
          insideEvents !==
          beforeEvents + 1
        ) {
          throw new Error(
            "[DI_K2E_1B_EVENT_NOT_VISIBLE_INSIDE_TRANSACTION]",
          );
        }

        throw new Error(
          ROLLBACK_SENTINEL,
        );
      },
    );

    throw new Error(
      "[DI_K2E_1B_ROLLBACK_SENTINEL_NOT_TRIGGERED]",
    );
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !==
        ROLLBACK_SENTINEL
    ) {
      throw error;
    }

    console.log(
      "DI_K2E_1B_EXPECTED_ROLLBACK_TRIGGERED",
    );
  }

  const afterEvidence =
    await prisma.instrumentEvidence.count({
      where: {
        instrumentId: gm.id,
      },
    });

  const afterEvents =
    await prisma.domainEvent.count({
      where: {
        streamId: gm.id,
        eventType:
          "INSTRUMENT_EVIDENCE_RECORDED",
      },
    });

  const survivingSmokeEvidence =
    await prisma.instrumentEvidence.count({
      where: {
        instrumentId: gm.id,
        title: SMOKE_TITLE,
      },
    });

  const gmAfter =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference: GM_REFERENCE,
      },
      select: {
        status: true,
        currentVersion: true,
      },
    });

  console.log(
    JSON.stringify(
      {
        after: {
          evidenceCount: afterEvidence,
          evidenceEventCount: afterEvents,
          survivingSmokeEvidence,
          gm: gmAfter,
        },
      },
      null,
      2,
    ),
  );

  if (
    afterEvidence !== beforeEvidence
  ) {
    throw new Error(
      "[DI_K2E_1B_EVIDENCE_ROLLBACK_FAILED]",
    );
  }

  if (
    afterEvents !== beforeEvents
  ) {
    throw new Error(
      "[DI_K2E_1B_EVENT_ROLLBACK_FAILED]",
    );
  }

  if (
    survivingSmokeEvidence !== 0
  ) {
    throw new Error(
      "[DI_K2E_1B_SMOKE_EVIDENCE_SURVIVED]",
    );
  }

  if (
    !gmAfter ||
    gmAfter.status !== gm.status ||
    gmAfter.currentVersion !==
      gm.currentVersion
  ) {
    throw new Error(
      "[DI_K2E_1B_GM_STATE_CHANGED]",
    );
  }

  console.log(
    "DI_K2E_1B_BUSINESS_RECORD_ROLLED_BACK",
  );

  console.log(
    "DI_K2E_1B_DOMAIN_EVENT_ROLLED_BACK",
  );

  console.log(
    "DI_K2E_1B_GM_STATE_PRESERVED",
  );

  console.log(
    "DI_K2E_1B_TRANSACTION_BOUNDARY_VALID",
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
