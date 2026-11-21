import { prisma } from "../../src/lib/prisma";

import {
  DOSSIER_EXECUTION_LANE_OPENED_EVENT,
  openDossierExecutionLane,
  type DossierExecutionLaneTarget,
} from "../../src/domains/control-center/dossiers/openDossierExecutionLane";

import {
  getTransitionKey,
} from "../../src/domains/control-center/dossierApprovalGates";

import {
  getTransitionRegistryEntry,
} from "../../src/domains/control-center/transitionRegistry";

const OPERATOR_EMAIL =
  "ar3e-runtime@axpt.local";

const OPERATOR_ROLES = [
  "ADMIN_PLATFORM",
];

const nonce =
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const prefix =
  `AR3E-${nonce}`;

const createdDossierIds: string[] = [];

type SmokeEvent = {
  eventType: string;
};

type SmokeInstrument = {
  type: string;
  version: string;
  status: string;
};

type SmokeGeneratedArtifact = {
  disposition: "CREATED" | "REUSED";
};

type PositiveCase = {
  label: string;
  settlement: string;
  toState: DossierExecutionLaneTarget;
  expectedProfile:
    | "ESCROW_SETTLEMENT"
    | "DIRECT_WIRE"
    | "CRYPTO_SETTLEMENT"
    | "DLC_OR_SBLC"
    | "REFINERY_SETTLEMENT";
  prerequisiteInstruments?: Array<{
    type:
      | "ANNEX_B_SETTLEMENT";
    title: string;
    status:
      | "ACTIVE"
      | "EXECUTED";
    version: string;
  }>;
};

const positiveCases: PositiveCase[] = [
  {
    label: "escrow",
    settlement:
      "Escrow settlement through trust account",
    expectedProfile:
      "ESCROW_SETTLEMENT",
    toState:
      "ESCROW_PENDING",
    prerequisiteInstruments: [
      {
        type:
          "ANNEX_B_SETTLEMENT",
        title:
          "Annex B Settlement",
        status:
          "ACTIVE",
        version:
          "v1",
      },
    ],
  },
  {
    label: "direct-wire",
    settlement:
      "USD MT103 direct wire bank transfer",
    expectedProfile:
      "DIRECT_WIRE",
    toState:
      "PAYMENT_INSTRUCTION_PENDING",
  },
  {
    label: "crypto",
    settlement:
      "USDT ERC-20 wallet settlement",
    expectedProfile:
      "CRYPTO_SETTLEMENT",
    toState:
      "CRYPTO_WALLET_CONFIRMATION",
  },
  {
    label: "financial-instrument",
    settlement:
      "SBLC settlement structure",
    expectedProfile:
      "DLC_OR_SBLC",
    toState:
      "FINANCIAL_INSTRUMENT_PENDING",
  },
  {
    label: "refinery",
    settlement:
      "Settlement at refinery after assay",
    expectedProfile:
      "REFINERY_SETTLEMENT",
    toState:
      "REFINERY_COORDINATION",
  },
];

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `ASSERTION_FAILED:${message}`,
    );
  }
}

async function expectError(
  label: string,
  expectedCode: string,
  operation: () => Promise<unknown>,
) {
  try {
    await operation();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message !==
      expectedCode
    ) {
      throw new Error(
        `${label}:EXPECTED_${expectedCode}:GOT_${message}`,
      );
    }

    console.log(
      `✓ ${label} → ${expectedCode}`,
    );

    return;
  }

  throw new Error(
    `${label}:EXPECTED_ERROR_NOT_THROWN:${expectedCode}`,
  );
}

async function createDossier({
  label,
  settlement,
  state = "SPA_EXECUTED",
}: {
  label: string;
  settlement: string;
  state?:
    | "SPA_EXECUTED"
    | DossierExecutionLaneTarget;
}) {
  const dossier =
    await prisma.transactionDossier.create({
      data: {
        reference:
          `${prefix}-${label}`,
        title:
          `AR-3E Runtime ${label}`,
        state,
        settlement,
        origin:
          "Mali",
      },
    });

  createdDossierIds.push(
    dossier.id,
  );

  return dossier;
}

async function satisfyApproval({
  dossierId,
  toState,
}: {
  dossierId: string;
  toState: DossierExecutionLaneTarget;
}) {
  const transitionKey =
    getTransitionKey(
      "SPA_EXECUTED",
      toState,
    );

  await prisma.dossierApprovalRequirement.create({
    data: {
      dossierId,
      transitionKey,
      requiredRole:
        "ADMIN_PLATFORM",
      requiredCount:
        1,
      status:
        "SATISFIED",
    },
  });
}

async function addPrerequisites({
  dossierId,
  instruments = [],
}: {
  dossierId: string;
  instruments?: NonNullable<
    PositiveCase["prerequisiteInstruments"]
  >;
}) {
  for (
    const instrument
    of instruments
  ) {
    await prisma.transactionDossierInstrument.create({
      data: {
        dossierId,
        type:
          instrument.type,
        title:
          instrument.title,
        status:
          instrument.status,
        version:
          instrument.version,
      },
    });
  }
}

async function assertCanonicalOpen({
  dossierId,
  expectedProfile,
  toState,
}: {
  dossierId: string;
  expectedProfile:
    PositiveCase["expectedProfile"];
  toState: DossierExecutionLaneTarget;
}) {
  const registryEntry =
    getTransitionRegistryEntry(
      getTransitionKey(
        "SPA_EXECUTED",
        toState,
      ),
    );

  assert(
    registryEntry,
    `${toState}:registry-entry-missing`,
  );

  const result =
    await openDossierExecutionLane({
      dossierId,
      toState,
      operatorEmail:
        OPERATOR_EMAIL,
      operatorRoles:
        OPERATOR_ROLES,
    });

  assert(
    result.changed === true,
    `${toState}:first-open-must-change`,
  );

  assert(
    result.alreadyOpened === false,
    `${toState}:first-open-not-idempotent`,
  );

  assert(
    result.dossier.state ===
      toState,
    `${toState}:state-not-updated`,
  );

  assert(
    result.lane.executionProfile ===
      expectedProfile,
    `${toState}:profile-mismatch`,
  );

  const current =
    await prisma.transactionDossier.findUniqueOrThrow({
      where: {
        id:
          dossierId,
      },
      include: {
        instruments: true,
        events: true,
      },
    });

  assert(
    current.state ===
      toState,
    `${toState}:persisted-state-mismatch`,
  );

  const authorityEvents =
    current.events.filter(
      (event: SmokeEvent) =>
        event.eventType ===
        DOSSIER_EXECUTION_LANE_OPENED_EVENT,
    );

  assert(
    authorityEvents.length ===
      1,
    `${toState}:authority-event-count-${authorityEvents.length}`,
  );

  const expectedArtifacts =
    registryEntry.generatedArtifacts;

  for (
    const expected
    of expectedArtifacts
  ) {
    const matching =
      current.instruments.filter(
        (instrument: SmokeInstrument) =>
          instrument.type ===
            expected.type &&
          instrument.version ===
            expected.version,
      );

    assert(
      matching.length ===
        1,
      `${toState}:${expected.type}:artifact-count-${matching.length}`,
    );

    assert(
      matching[0].status ===
        expected.status,
      `${toState}:${expected.type}:status-${matching[0].status}`,
    );
  }

  const firstOpenArtifactCount =
    result.generatedArtifacts.length;

  assert(
    firstOpenArtifactCount ===
      expectedArtifacts.length,
    `${toState}:result-artifact-count-${firstOpenArtifactCount}`,
  );

  assert(
    result.generatedArtifacts.every(
      (artifact: SmokeGeneratedArtifact) =>
        artifact.disposition ===
        "CREATED",
    ),
    `${toState}:first-open-artifacts-not-created`,
  );

  /*
   * Retry must not create:
   * - another authority event
   * - another lane artifact
   * - another state mutation
   */
  const retry =
    await openDossierExecutionLane({
      dossierId,
      toState,
      operatorEmail:
        OPERATOR_EMAIL,
      operatorRoles:
        OPERATOR_ROLES,
    });

  assert(
    retry.changed === false,
    `${toState}:retry-changed`,
  );

  assert(
    retry.alreadyOpened === true,
    `${toState}:retry-not-idempotent`,
  );

  const afterRetry =
    await prisma.transactionDossier.findUniqueOrThrow({
      where: {
        id:
          dossierId,
      },
      include: {
        instruments: true,
        events: true,
      },
    });

  const authorityEventsAfterRetry =
    afterRetry.events.filter(
      (event: SmokeEvent) =>
        event.eventType ===
        DOSSIER_EXECUTION_LANE_OPENED_EVENT,
    );

  assert(
    authorityEventsAfterRetry.length ===
      1,
    `${toState}:retry-authority-event-count-${authorityEventsAfterRetry.length}`,
  );

  for (
    const expected
    of expectedArtifacts
  ) {
    const matching =
      afterRetry.instruments.filter(
        (instrument: SmokeInstrument) =>
          instrument.type ===
            expected.type &&
          instrument.version ===
            expected.version,
      );

    assert(
      matching.length ===
        1,
      `${toState}:${expected.type}:retry-artifact-count-${matching.length}`,
    );
  }

  console.log(
    `✓ ${expectedProfile} → ${toState}`,
  );

  console.log(
    `  artifacts=${expectedArtifacts
      .map(
        (artifact) =>
          `${artifact.type}:${artifact.status}`,
      )
      .join(", ") || "none"}`,
  );

  console.log(
    "  canonical authority event singular",
  );

  console.log(
    "  retry idempotent",
  );
}

async function positiveMatrix() {
  console.log();
  console.log(
    "── POSITIVE PROFILE MATRIX ──",
  );

  for (
    const testCase
    of positiveCases
  ) {
    const dossier =
      await createDossier({
        label:
          `positive-${testCase.label}`,
        settlement:
          testCase.settlement,
      });

    await satisfyApproval({
      dossierId:
        dossier.id,
      toState:
        testCase.toState,
    });

    await addPrerequisites({
      dossierId:
        dossier.id,
      instruments:
        testCase.prerequisiteInstruments ??
        [],
    });

    /*
     * Escrow causal-order proof:
     * setup instruction MUST NOT exist before lane opening.
     */
    if (
      testCase.toState ===
      "ESCROW_PENDING"
    ) {
      const preExistingSetup =
        await prisma.transactionDossierInstrument.count({
          where: {
            dossierId:
              dossier.id,
            type:
              "ESCROW_SETUP_INSTRUCTION",
          },
        });

      assert(
        preExistingSetup ===
          0,
        "escrow:setup-instruction-existed-before-lane-open",
      );
    }

    await assertCanonicalOpen({
      dossierId:
        dossier.id,
      expectedProfile:
        testCase.expectedProfile,
      toState:
        testCase.toState,
    });

    if (
      testCase.toState ===
      "ESCROW_PENDING"
    ) {
      const setup =
        await prisma.transactionDossierInstrument.findFirst({
          where: {
            dossierId:
              dossier.id,
            type:
              "ESCROW_SETUP_INSTRUCTION",
          },
        });

      assert(
        setup,
        "escrow:setup-instruction-not-created",
      );

      assert(
        setup.status ===
          "DRAFT",
        `escrow:setup-instruction-status-${setup.status}`,
      );

      console.log(
        "  ✓ escrow setup instruction created by lane opening, not required before it",
      );
    }
  }
}

async function wrongLaneProof() {
  console.log();
  console.log(
    "── WRONG-LANE REJECTION ──",
  );

  const dossier =
    await createDossier({
      label:
        "wrong-lane",
      settlement:
        "USDT ERC-20 wallet settlement",
    });

  await satisfyApproval({
    dossierId:
      dossier.id,
    toState:
      "ESCROW_PENDING",
  });

  await expectError(
    "crypto dossier cannot open escrow lane",
    "DOSSIER_EXECUTION_LANE_PROFILE_BLOCKED",
    () =>
      openDossierExecutionLane({
        dossierId:
          dossier.id,
        toState:
          "ESCROW_PENDING",
        operatorEmail:
          OPERATOR_EMAIL,
        operatorRoles:
          OPERATOR_ROLES,
      }),
  );

  const current =
    await prisma.transactionDossier.findUniqueOrThrow({
      where: {
        id:
          dossier.id,
      },
    });

  assert(
    current.state ===
      "SPA_EXECUTED",
    "wrong-lane-mutated-state",
  );
}

async function missingApprovalProof() {
  console.log();
  console.log(
    "── MISSING APPROVAL REJECTION ──",
  );

  const dossier =
    await createDossier({
      label:
        "missing-approval",
      settlement:
        "USD MT103 direct wire",
    });

  await expectError(
    "lane opening without stored satisfied approval",
    "DOSSIER_EXECUTION_LANE_APPROVAL_BLOCKED",
    () =>
      openDossierExecutionLane({
        dossierId:
          dossier.id,
        toState:
          "PAYMENT_INSTRUCTION_PENDING",
        operatorEmail:
          OPERATOR_EMAIL,
        operatorRoles:
          OPERATOR_ROLES,
      }),
  );

  const current =
    await prisma.transactionDossier.findUniqueOrThrow({
      where: {
        id:
          dossier.id,
      },
      include: {
        instruments: true,
        events: true,
      },
    });

  assert(
    current.state ===
      "SPA_EXECUTED",
    "missing-approval-mutated-state",
  );

  assert(
    current.instruments.length ===
      0,
    "missing-approval-created-artifact",
  );

  assert(
    !current.events.some(
      (event: SmokeEvent) =>
        event.eventType ===
        DOSSIER_EXECUTION_LANE_OPENED_EVENT,
    ),
    "missing-approval-created-authority-event",
  );
}

async function missingEscrowAnnexProof() {
  console.log();
  console.log(
    "── ESCROW SETTLEMENT ARCHITECTURE REJECTION ──",
  );

  const dossier =
    await createDossier({
      label:
        "escrow-missing-annex",
      settlement:
        "Escrow settlement",
    });

  await satisfyApproval({
    dossierId:
      dossier.id,
    toState:
      "ESCROW_PENDING",
  });

  await expectError(
    "escrow lane without active Annex B",
    "DOSSIER_EXECUTION_LANE_ARTIFACT_BLOCKED",
    () =>
      openDossierExecutionLane({
        dossierId:
          dossier.id,
        toState:
          "ESCROW_PENDING",
        operatorEmail:
          OPERATOR_EMAIL,
        operatorRoles:
          OPERATOR_ROLES,
      }),
  );

  const current =
    await prisma.transactionDossier.findUniqueOrThrow({
      where: {
        id:
          dossier.id,
      },
      include: {
        instruments: true,
      },
    });

  assert(
    current.state ===
      "SPA_EXECUTED",
    "missing-annex-mutated-state",
  );

  assert(
    !current.instruments.some(
      (instrument: SmokeInstrument) =>
        instrument.type ===
        "ESCROW_SETUP_INSTRUCTION",
    ),
    "missing-annex-created-escrow-setup",
  );
}

async function bareStateWithoutAuthorityProof() {
  console.log();
  console.log(
    "── BARE TARGET STATE IS NOT AUTHORITY ──",
  );

  const dossier =
    await createDossier({
      label:
        "bare-state",
      settlement:
        "USDT ERC-20 wallet settlement",
      state:
        "CRYPTO_WALLET_CONFIRMATION",
    });

  await expectError(
    "bare lane state without canonical event",
    "DOSSIER_EXECUTION_LANE_STATE_WITHOUT_AUTHORITY_EVENT",
    () =>
      openDossierExecutionLane({
        dossierId:
          dossier.id,
        toState:
          "CRYPTO_WALLET_CONFIRMATION",
        operatorEmail:
          OPERATOR_EMAIL,
        operatorRoles:
          OPERATOR_ROLES,
      }),
  );
}

async function cleanup() {
  if (
    createdDossierIds.length ===
    0
  ) {
    return;
  }

  await prisma.transactionDossier.deleteMany({
    where: {
      id: {
        in:
          createdDossierIds,
      },
    },
  });
}

async function main() {
  console.log(
    "════ AR-3E.3A RUNTIME AUTHORITY MATRIX ════",
  );

  try {
    await positiveMatrix();

    await wrongLaneProof();

    await missingApprovalProof();

    await missingEscrowAnnexProof();

    await bareStateWithoutAuthorityProof();

    console.log();
    console.log(
      "════════════════════════════════════════════════════",
    );
    console.log(
      "✓ ALL FIVE EXECUTION PROFILES OPEN CANONICALLY",
    );
    console.log(
      "✓ PROFILE AUTHORITY ENFORCED",
    );
    console.log(
      "✓ STORED APPROVAL AUTHORITY ENFORCED",
    );
    console.log(
      "✓ ESCROW ANNEX GATE ENFORCED",
    );
    console.log(
      "✓ ESCROW SETUP CREATED AFTER LANE OPEN AUTHORITY",
    );
    console.log(
      "✓ LANE ARTIFACTS MATCH REGISTRY",
    );
    console.log(
      "✓ AUTHORITY EVENT SINGULAR",
    );
    console.log(
      "✓ RETRY IDEMPOTENT",
    );
    console.log(
      "✓ BARE STATE IS NOT AUTHORITY",
    );
    console.log(
      "════════════════════════════════════════════════════",
    );
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    "AR3E3A_RUNTIME_MATRIX_FAILED",
    error,
  );

  process.exitCode =
    1;
});
