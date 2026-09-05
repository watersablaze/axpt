import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  PrismaClient,
  type TransactionClient,
} from "@prisma/client";

import {
  CAPITAL_RECEIPT_EVIDENCE_TYPE,
  CAPITAL_RECEIPT_METHOD,
} from "../../src/domains/treasury/gateway/capital-receipts/contracts";

import { reportProgramCapitalReceiptIdempotentlyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/reportProgramCapitalReceiptIdempotentlyWithClient";

import { beginProgramCapitalReceiptVerificationDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/beginProgramCapitalReceiptVerificationDurablyWithClient";

import { admitProgramCapitalReceiptEvidenceDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/admitProgramCapitalReceiptEvidenceDurablyWithClient";

import { verifyProgramCapitalReceiptDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/verifyProgramCapitalReceiptDurablyWithClient";

import { recognizeProgramCapitalDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/recognizeProgramCapitalDurablyWithClient";

import { getAvailableCapitalPositionWithClient } from "../../src/domains/treasury/gateway/capital-position/application/getAvailableCapitalPositionWithClient";

import { recordTransferCapacityAssessmentIdempotentlyWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentIdempotentlyWithClient";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
  type TransferCapacityConstraint,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { applyTreasuryTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentDurablyWithClient";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewDurablyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

const prisma = new PrismaClient();

function receiptContext(
  step: string,
  requestedAt: Date,
  fixtureId: string,
) {
  return {
    commandId: `source-funds-${step}-command-${fixtureId}`,
    actorId: `source-funds-capital-operator-${fixtureId}`,
    correlationId: `source-funds-capital-${fixtureId}`,
    requestedAt,
    idempotencyKey: `source-funds-${step}-idempotency-${fixtureId}`,
  };
}

function assertErrorCode(
  error: unknown,
  code: string,
): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
  );
}

async function establishRecognizedCapital(params: {
  fixtureId: string;
  receiptId: string;
  programId: string;
  programAccountId: string;
  amount: string;
  suffix: string;
  client: TransactionClient;
}): Promise<void> {
  const {
    fixtureId,
    receiptId,
    programId,
    programAccountId,
    amount,
    suffix,
    client,
  } = params;

  const transactionHash =
    `0x${fixtureId.replaceAll("-", "")}${suffix}`;

  const blockchainEvidenceId =
    `source-funds-blockchain-evidence-${suffix}-${fixtureId}`;

  const operatorEvidenceId =
    `source-funds-operator-evidence-${suffix}-${fixtureId}`;

  await reportProgramCapitalReceiptIdempotentlyWithClient({
    request: {
      receiptId,

      reference: `SOURCE-FUNDS-${suffix}-${fixtureId}`,

      eventId: `source-funds-reported-${suffix}-${fixtureId}`,

      context: receiptContext(
        `report-${suffix}`,
        new Date("2026-09-05T12:01:00.000Z"),
        fixtureId,
      ),

      payload: {
        programId,

        destinationProgramAccountId: programAccountId,

        declaredAmount: {
          amount,
          currency: "USD",
        },

        receiptMethod:
          CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

        externalReference: transactionHash,

        receivedAt: new Date("2026-09-05T12:00:00.000Z"),
      },
    },

    client,
  });

  await beginProgramCapitalReceiptVerificationDurablyWithClient({
    receiptId,

    eventId:
      `source-funds-verification-started-${suffix}-${fixtureId}`,

    context: receiptContext(
      `begin-verification-${suffix}`,
      new Date("2026-09-05T12:02:00.000Z"),
      fixtureId,
    ),

    client,
  });

  await admitProgramCapitalReceiptEvidenceDurablyWithClient({
    receiptId,

    evidenceId: blockchainEvidenceId,

    evidenceType:
      CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

    artifactId:
      `source-funds-blockchain-artifact-${suffix}-${fixtureId}`,

    externalReference: transactionHash,

    recordedAt: new Date("2026-09-05T12:03:00.000Z"),

    eventId:
      `source-funds-blockchain-evidence-event-${suffix}-${fixtureId}`,

    context: receiptContext(
      `blockchain-evidence-${suffix}`,
      new Date("2026-09-05T12:03:00.000Z"),
      fixtureId,
    ),

    client,
  });

  await admitProgramCapitalReceiptEvidenceDurablyWithClient({
    receiptId,

    evidenceId: operatorEvidenceId,

    evidenceType:
      CAPITAL_RECEIPT_EVIDENCE_TYPE.OPERATOR_CONFIRMATION,

    artifactId:
      `source-funds-operator-artifact-${suffix}-${fixtureId}`,

    recordedAt: new Date("2026-09-05T12:04:00.000Z"),

    eventId:
      `source-funds-operator-evidence-event-${suffix}-${fixtureId}`,

    context: receiptContext(
      `operator-evidence-${suffix}`,
      new Date("2026-09-05T12:04:00.000Z"),
      fixtureId,
    ),

    client,
  });

  await verifyProgramCapitalReceiptDurablyWithClient({
    command: {
      context: receiptContext(
        `verify-${suffix}`,
        new Date("2026-09-05T12:05:00.000Z"),
        fixtureId,
      ),

      payload: {
        receiptId,

        verifiedAmount: {
          amount,
          currency: "USD",
        },

        evidenceIds: [
          blockchainEvidenceId,
          operatorEvidenceId,
        ],

        verifiedAt: new Date("2026-09-05T12:05:00.000Z"),
      },
    },

    eventId:
      `source-funds-verified-event-${suffix}-${fixtureId}`,

    client,
  });

  await recognizeProgramCapitalDurablyWithClient({
    command: {
      context: receiptContext(
        `recognize-${suffix}`,
        new Date("2026-09-05T12:06:00.000Z"),
        fixtureId,
      ),

      payload: {
        receiptId,

        recognizedAmount: {
          amount,
          currency: "USD",
        },

        recognitionMemo:
          "Canonical SOURCE_FUNDS integration fixture.",
      },
    },

    eventId:
      `source-funds-recognized-event-${suffix}-${fixtureId}`,

    client,
  });
}

async function originateAndAuthorizeTransfer(params: {
  fixtureId: string;
  transferId: string;
  programId: string;
  programAccountId: string;
  suffix: string;
  client: TransactionClient;
}): Promise<void> {
  const {
    fixtureId,
    transferId,
    programId,
    programAccountId,
    suffix,
    client,
  } = params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference:
        `AXPT-SOURCE-FUNDS-${suffix}-${fixtureId}`,

      eventId:
        `source-funds-transfer-created-${suffix}-${fixtureId}`,

      context: {
        commandId:
          `source-funds-transfer-create-command-${suffix}-${fixtureId}`,

        actorId:
          `source-funds-transfer-creator-${fixtureId}`,

        correlationId:
          `source-funds-transfer-create-correlation-${suffix}-${fixtureId}`,

        requestedAt:
          new Date("2026-09-05T12:07:00.000Z"),

        idempotencyKey:
          `source-funds-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId,

        source: {
          kind:
            TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId,
        },

        destination: {
          kind:
            TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId:
            `source-funds-destination-${suffix}-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose:
          `Canonical SOURCE_FUNDS capacity ${suffix}.`,
      },
    },

    client,
  });

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId:
      `source-funds-authority-review-${suffix}-${fixtureId}`,

    context: {
      commandId:
        `source-funds-authority-review-command-${suffix}-${fixtureId}`,

      actorId:
        `source-funds-authority-reviewer-${fixtureId}`,

      correlationId:
        `source-funds-authority-review-correlation-${suffix}-${fixtureId}`,

      requestedAt:
        new Date("2026-09-05T12:08:00.000Z"),

      idempotencyKey:
        `source-funds-authority-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const authorityAssessmentId =
    `source-funds-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,

      eventId:
        `source-funds-authority-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId:
          `source-funds-authority-assessment-command-${suffix}-${fixtureId}`,

        actorId:
          `source-funds-authority-assessor-${fixtureId}`,

        correlationId:
          `source-funds-authority-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt:
          new Date("2026-09-05T12:09:00.000Z"),

        idempotencyKey:
          `source-funds-authority-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result:
          TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `source-funds-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt:
          new Date("2026-09-05T12:08:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId: authorityAssessmentId,

    eventId:
      `source-funds-authority-application-${suffix}-${fixtureId}`,

    context: {
      commandId:
        `source-funds-authority-application-command-${suffix}-${fixtureId}`,

      actorId:
        `source-funds-authority-applicator-${fixtureId}`,

      correlationId:
        `source-funds-authority-application-correlation-${suffix}-${fixtureId}`,

      requestedAt:
        new Date("2026-09-05T12:10:00.000Z"),

      idempotencyKey:
        `source-funds-authority-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const programId =
    `source-funds-program-${fixtureId}`;

  const programAccountId =
    `source-funds-program-account-${fixtureId}`;

  const transferId =
    `source-funds-transfer-${fixtureId}`;

  const secondTransferId =
    `source-funds-second-transfer-${fixtureId}`;

  const assessmentId =
    `source-funds-assessment-${fixtureId}`;

  const idempotencyKey =
    `source-funds-assessment-idempotency-${fixtureId}`;

  const actorId =
    `source-funds-capacity-assessor-${fixtureId}`;

  try {
    /*
     * Financial truth at T1:
     *
     * recognized inbound = 524,980
     * confirmed outbound =       0
     * committed          =       0
     * available          = 524,980
     */
    await prisma.$transaction(
      async (tx: TransactionClient) => {
        await establishRecognizedCapital({
          fixtureId,

          receiptId:
            `source-funds-receipt-initial-${fixtureId}`,

          programId,

          programAccountId,

          amount: "524980.00",

          suffix: "initial",

          client: tx,
        });

        await originateAndAuthorizeTransfer({
          fixtureId,

          transferId,

          programId,

          programAccountId,

          suffix: "primary",

          client: tx,
        });
      },
    );

    const initialPosition =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          getAvailableCapitalPositionWithClient({
            programAccountId,

            currency: "USD",

            client: tx,
          }),
      );

    assert.equal(
      initialPosition.availableAmount.amount,
      "524980",
    );

    const baseRequest = {
      assessmentId,

      eventId:
        `source-funds-assessment-event-${fixtureId}`,

      context: {
        commandId:
          `source-funds-assessment-command-${fixtureId}`,

        actorId,

        correlationId:
          `source-funds-assessment-correlation-${fixtureId}`,

        requestedAt:
          new Date("2026-09-05T12:11:00.000Z"),

        idempotencyKey,
      },

      payload: {
        transferId,

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        constraints: [
          {
            type:
              TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

            status:
              TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

            limit: {
              amount: "850000.00",

              currency: "USD",
            },

            evidenceReferenceIds: [
              `operator-invented-source-funds-${fixtureId}`,
            ],
          },

          {
            type:
              TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

            status:
              TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

            limit: {
              amount: "600000.00",

              currency: "USD",
            },

            evidenceReferenceIds: [
              `source-funds-rail-evidence-${fixtureId}`,
            ],
          },
        ],

        assessedAt:
          new Date("2026-09-05T12:10:30.000Z"),

        notes:
          "Canonical SOURCE_FUNDS integration assessment.",
      },
    } as const;

    /*
     * A — operator assertion cannot manufacture
     * SOURCE_FUNDS truth.
     */
    const first =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          recordTransferCapacityAssessmentIdempotentlyWithClient({
            request: baseRequest,

            client: tx,
          }),
      );

    assert.equal(first.disposition, "RECORDED");

    const firstSourceFunds =
      first.aggregate.constraints.filter(
        (constraint: TransferCapacityConstraint) =>
          constraint.type ===
          TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,
      );

    assert.equal(firstSourceFunds.length, 1);

    assert.deepEqual(firstSourceFunds[0]?.limit, {
      amount: "524980",

      currency: "USD",
    });

    assert.deepEqual(
      firstSourceFunds[0]?.evidenceReferenceIds,
      [],
    );

    assert.deepEqual(first.aggregate.executableNow, {
      amount: "524980",

      currency: "USD",
    });

    /*
     * B — changing only the caller's invented
     * SOURCE_FUNDS assertion does not change
     * material request identity.
     */
    const retry =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          recordTransferCapacityAssessmentIdempotentlyWithClient({
            request: {
              ...baseRequest,

              assessmentId:
                `source-funds-retry-assessment-${fixtureId}`,

              eventId:
                `source-funds-retry-event-${fixtureId}`,

              context: {
                ...baseRequest.context,

                commandId:
                  `source-funds-retry-command-${fixtureId}`,

                correlationId:
                  `source-funds-retry-correlation-${fixtureId}`,

                requestedAt:
                  new Date("2026-09-05T12:12:00.000Z"),
              },

              payload: {
                ...baseRequest.payload,

                constraints: [
                  {
                    ...baseRequest.payload.constraints[0],

                    limit: {
                      amount: "900000.00",

                      currency: "USD",
                    },
                  },

                  baseRequest.payload.constraints[1],
                ],
              },
            },

            client: tx,
          }),
      );

    assert.equal(retry.disposition, "REPLAYED");

    assert.equal(
      retry.aggregate.id,
      first.aggregate.id,
    );

    assert.deepEqual(retry.aggregate.executableNow, {
      amount: "524980",

      currency: "USD",
    });

    /*
     * C — caller-owned capacity law remains material.
     *
     * Changing RAIL with the same idempotency key
     * must collide.
     */
    let railCollisionError: unknown;

    try {
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          recordTransferCapacityAssessmentIdempotentlyWithClient({
            request: {
              ...baseRequest,

              payload: {
                ...baseRequest.payload,

                constraints: [
                  baseRequest.payload.constraints[0],

                  {
                    ...baseRequest.payload.constraints[1],

                    limit: {
                      amount: "500000.00",

                      currency: "USD",
                    },
                  },
                ],
              },
            },

            client: tx,
          }),
      );
    } catch (error: unknown) {
      railCollisionError = error;
    }

    assertErrorCode(
      railCollisionError,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * D — SOURCE_FUNDS is system-owned.
     *
     * A caller need not submit it at all.
     */
    await prisma.$transaction(
      async (tx: TransactionClient) =>
        originateAndAuthorizeTransfer({
          fixtureId,

          transferId: secondTransferId,

          programId,

          programAccountId,

          suffix: "second",

          client: tx,
        }),
    );

    const noSourceFunds =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          recordTransferCapacityAssessmentIdempotentlyWithClient({
            request: {
              assessmentId:
                `source-funds-no-input-assessment-${fixtureId}`,

              eventId:
                `source-funds-no-input-event-${fixtureId}`,

              context: {
                commandId:
                  `source-funds-no-input-command-${fixtureId}`,

                actorId,

                correlationId:
                  `source-funds-no-input-correlation-${fixtureId}`,

                requestedAt:
                  new Date("2026-09-05T12:13:00.000Z"),

                idempotencyKey:
                  `source-funds-no-input-idempotency-${fixtureId}`,
              },

              payload: {
                transferId: secondTransferId,

                requestedAmount: {
                  amount: "1000000.00",

                  currency: "USD",
                },

                constraints: [
                  {
                    type:
                      TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

                    status:
                      TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

                    limit: {
                      amount: "600000.00",

                      currency: "USD",
                    },

                    evidenceReferenceIds: [
                      `source-funds-second-rail-evidence-${fixtureId}`,
                    ],
                  },
                ],

                assessedAt:
                  new Date("2026-09-05T12:12:30.000Z"),
              },
            },

            client: tx,
          }),
      );

    const injectedSourceFunds =
      noSourceFunds.aggregate.constraints.filter(
        (constraint: TransferCapacityConstraint) =>
          constraint.type ===
          TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,
      );

    assert.equal(injectedSourceFunds.length, 1);

    assert.deepEqual(injectedSourceFunds[0]?.limit, {
      amount: "524980",

      currency: "USD",
    });

    /*
     * E — historical replay remains historical even
     * after current financial truth changes.
     *
     * Add another 25,020 USD:
     *
     * available 524,980 → 550,000
     */
    await prisma.$transaction(
      async (tx: TransactionClient) =>
        establishRecognizedCapital({
          fixtureId,

          receiptId:
            `source-funds-receipt-additional-${fixtureId}`,

          programId,

          programAccountId,

          amount: "25020.00",

          suffix: "additional",

          client: tx,
        }),
    );

    const laterPosition =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          getAvailableCapitalPositionWithClient({
            programAccountId,

            currency: "USD",

            client: tx,
          }),
      );

    assert.equal(
      laterPosition.availableAmount.amount,
      "550000",
    );

    const historicalReplay =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          recordTransferCapacityAssessmentIdempotentlyWithClient({
            request: {
              ...baseRequest,

              assessmentId:
                `source-funds-historical-retry-${fixtureId}`,

              eventId:
                `source-funds-historical-retry-event-${fixtureId}`,

              context: {
                ...baseRequest.context,

                commandId:
                  `source-funds-historical-retry-command-${fixtureId}`,

                correlationId:
                  `source-funds-historical-retry-correlation-${fixtureId}`,

                requestedAt:
                  new Date("2026-09-05T12:14:00.000Z"),
              },
            },

            client: tx,
          }),
      );

    assert.equal(
      historicalReplay.disposition,
      "REPLAYED",
    );

    assert.deepEqual(
      historicalReplay.aggregate.executableNow,
      {
        amount: "524980",

        currency: "USD",
      },
    );

    /*
     * A new idempotency identity creates a new
     * Capacity finding against current truth.
     */
    const currentAssessment =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          recordTransferCapacityAssessmentIdempotentlyWithClient({
            request: {
              ...baseRequest,

              assessmentId:
                `source-funds-current-assessment-${fixtureId}`,

              eventId:
                `source-funds-current-event-${fixtureId}`,

              context: {
                ...baseRequest.context,

                commandId:
                  `source-funds-current-command-${fixtureId}`,

                correlationId:
                  `source-funds-current-correlation-${fixtureId}`,

                requestedAt:
                  new Date("2026-09-05T12:15:00.000Z"),

                idempotencyKey:
                  `source-funds-current-idempotency-${fixtureId}`,
              },

              payload: {
                ...baseRequest.payload,

                assessedAt:
                  new Date("2026-09-05T12:14:30.000Z"),
              },
            },

            client: tx,
          }),
      );

    assert.equal(
      currentAssessment.disposition,
      "RECORDED",
    );

    const currentSourceFunds =
      currentAssessment.aggregate.constraints.find(
        (constraint: TransferCapacityConstraint) =>
          constraint.type ===
          TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,
      );

    assert.deepEqual(currentSourceFunds?.limit, {
      amount: "550000",

      currency: "USD",
    });

    assert.deepEqual(
      currentAssessment.aggregate.executableNow,
      {
        amount: "550000",

        currency: "USD",
      },
    );

    console.log(
      "✓ Canonical SOURCE_FUNDS Capacity Assessment integration smoke test passed",
    );

    console.log({
      initialPosition:
        initialPosition.availableAmount.amount,

      operatorClaim: "850000",

      recordedSourceFunds:
        firstSourceFunds[0]?.limit?.amount,

      firstExecutable:
        first.aggregate.executableNow?.amount,

      retryWithChangedOperatorClaim:
        retry.disposition,

      callerOwnedRailChangeRejected: true,

      sourceFundsInjectedWithoutCallerInput: true,

      laterPosition:
        laterPosition.availableAmount.amount,

      historicalReplay: {
        disposition:
          historicalReplay.disposition,

        executableNow:
          historicalReplay.aggregate.executableNow?.amount,
      },

      newAssessmentAgainstCurrentTruth: {
        disposition:
          currentAssessment.disposition,

        sourceFunds:
          currentSourceFunds?.limit?.amount,

        executableNow:
          currentAssessment.aggregate.executableNow?.amount,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);

  process.exitCode = 1;
});
