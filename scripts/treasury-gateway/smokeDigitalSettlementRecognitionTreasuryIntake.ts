import assert from "node:assert/strict";

import {
  assertDigitalSettlementRecognitionTreasuryIntake,
  deriveDigitalSettlementRecognitionTreasuryReceiptIdentity,
  type DigitalSettlementRecognitionTreasuryIntake,
} from "../../src/domains/treasury/gateway/capital-receipts/intake/digitalSettlementRecognitionIntake";

const OBSERVATION_ID =
  "observation-rb1c3a-001";

const RECOGNITION_EVENT_ID =
  "domain-event-rb1c3a-001";

const TRANSACTION_HASH =
  `0x${"ab".repeat(32)}`;

function createIntake():
  DigitalSettlementRecognitionTreasuryIntake {
  return {
    source: {
      recognitionEventId:
        RECOGNITION_EVENT_ID,

      instrumentId:
        "instrument-rb1c3a-001",

      instrumentVersionId:
        "instrument-version-rb1c3a-001",

      settlementInstructionId:
        "settlement-rb1c3a-001",

      observationId:
        OBSERVATION_ID,

      chainId:
        1,

      transactionHash:
        TRANSACTION_HASH,

      logIndex:
        7,

      tokenContractAddress:
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",

      receivingAddress:
        "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",

      amount: {
        amount:
          "50",

        currency:
          "USDT",
      },

      receivedAt:
        new Date(
          "2026-09-22T12:00:00.000Z",
        ),

      recognizedAt:
        new Date(
          "2026-09-22T12:01:00.000Z",
        ),
    },

    routing: {
      programId:
        "program-rb1c3a-001",

      destinationProgramAccountId:
        "program-account-rb1c3a-001",

      treasuryActorId:
        "treasury-actor-rb1c3a-001",
    },
  };
}

function main(): void {
  const intake =
    createIntake();

  assert.doesNotThrow(
    () =>
      assertDigitalSettlementRecognitionTreasuryIntake(
        intake,
      ),
  );

  const identity =
    deriveDigitalSettlementRecognitionTreasuryReceiptIdentity(
      intake,
    );

  assert.equal(
    identity.receiptId,
    `dsi-recognition-receipt:${OBSERVATION_ID}`,
  );

  assert.equal(
    identity.idempotencyKey,
    `dsi-recognition-report:${OBSERVATION_ID}`,
  );

  assert.equal(
    identity.causationId,
    RECOGNITION_EVENT_ID,
  );

  assert.equal(
    identity.correlationId,
    "dsi-recognition:instrument-rb1c3a-001",
  );

  /*
   * Same canonical source fact must derive
   * exactly the same Treasury identities.
   */
  assert.deepEqual(
    deriveDigitalSettlementRecognitionTreasuryReceiptIdentity(
      createIntake(),
    ),
    identity,
  );

  /*
   * Treasury routing is explicit authority.
   * It must not be inferred from the wallet.
   */
  assert.throws(
    () =>
      assertDigitalSettlementRecognitionTreasuryIntake({
        ...intake,

        routing: {
          ...intake.routing,

          destinationProgramAccountId:
            "",
        },
      }),
    /DSI_TREASURY_INTAKE_DESTINATION_PROGRAM_ACCOUNT_ID_REQUIRED/,
  );

  /*
   * Recognition time is not receipt time.
   * Receipt cannot occur after institutional recognition.
   */
  assert.throws(
    () =>
      assertDigitalSettlementRecognitionTreasuryIntake({
        ...intake,

        source: {
          ...intake.source,

          receivedAt:
            new Date(
              "2026-09-22T12:02:00.000Z",
            ),
        },
      }),
    /DSI_TREASURY_INTAKE_RECEIVED_AFTER_RECOGNITION/,
  );

  /*
   * This contract deliberately contains no
   * Treasury verification, recognition, allocation,
   * availability, instruction, or execution authority.
   */
  assert.equal(
    "artifactId" in intake.source,
    false,
  );

  assert.equal(
    "recognizedAmount" in intake.source,
    false,
  );

  assert.equal(
    "verifiedAmount" in intake.source,
    false,
  );

  console.log(
    "DSI_TREASURY_INTAKE_CONTRACT_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTING_EXPLICIT_OK",
  );

  console.log(
    "DSI_TREASURY_RECEIPT_IDENTITY_DETERMINISTIC_OK",
  );

  console.log(
    "DSI_TREASURY_RECOGNITION_CAUSATION_BOUND_OK",
  );

  console.log(
    "DSI_TREASURY_INTAKE_NO_CAPITAL_AUTHORITY_OK",
  );
}

main();
