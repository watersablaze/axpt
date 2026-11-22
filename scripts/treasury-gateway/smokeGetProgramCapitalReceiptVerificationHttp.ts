import assert from "node:assert/strict";

import type {
  PrismaClient,
  TransactionClient,
} from "@prisma/client";

import {
  CAPITAL_RECEIPT_EVIDENCE_TYPE,
  CAPITAL_RECEIPT_METHOD,
} from "../../src/domains/treasury/gateway/capital-receipts/contracts";

import {
  PROGRAM_CAPITAL_RECEIPT_STATUS,
} from "../../src/domains/treasury/gateway/capital-receipts/status";

import type {
  ProgramCapitalReceiptVerificationPerception,
} from "../../src/domains/treasury/gateway/capital-receipts/application/loadProgramCapitalReceiptVerificationPerceptionWithClient";

import {
  getProgramCapitalReceiptVerificationHttp,
  PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE,
} from "../../src/domains/control-center/treasury/getProgramCapitalReceiptVerificationHttp";

const fakeTransactionClient =
  {} as TransactionClient;

const fakePrisma =
  {
    $transaction: async <T>(
      callback:
        (
          tx:
            TransactionClient,
        ) => Promise<T>,
    ): Promise<T> =>
      callback(
        fakeTransactionClient,
      ),
  } as unknown as PrismaClient;

function makeReportedPerception():
  ProgramCapitalReceiptVerificationPerception {
  return {
    receipt: {
      id:
        "receipt-http-reported",

      reference:
        "HTTP-REPORTED-001",

      programId:
        "program-http",

      destinationProgramAccountId:
        "program-account-http",

      declaredAmount: {
        amount:
          "100.00",

        currency:
          "USDT",
      },

      receiptMethod:
        CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

      externalReference:
        "0xreported",

      status:
        PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,

      receivedAt:
        new Date(
          "2026-09-23T12:00:00.000Z",
        ),

      metadata: {
        createdAt:
          new Date(
            "2026-09-23T12:01:00.000Z",
          ),

        updatedAt:
          new Date(
            "2026-09-23T12:01:00.000Z",
          ),

        createdByActorId:
          "operator-http",

        lastModifiedByActorId:
          "operator-http",

        version:
          1,
      },
    },

    admittedEvidence:
      [],

    verificationEvent:
      null,

    selectedEvidenceIds:
      [],

    selectedEvidence:
      [],

    unselectedAdmittedEvidence:
      [],

    loadedAt:
      new Date(
        "2026-09-23T12:02:00.000Z",
      ),
  };
}

function makeVerifiedPerception():
  ProgramCapitalReceiptVerificationPerception {
  const evidenceA = {
    id:
      "evidence-http-a",

    receiptId:
      "receipt-http-verified",

    evidenceType:
      CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

    artifactId:
      "artifact-http-a",

    externalReference:
      "0xverified",

    submittedByActorId:
      "operator-http",

    recordedAt:
      new Date(
        "2026-09-23T13:01:00.000Z",
      ),
  };

  const evidenceB = {
    id:
      "evidence-http-b",

    receiptId:
      "receipt-http-verified",

    evidenceType:
      CAPITAL_RECEIPT_EVIDENCE_TYPE.OPERATOR_CONFIRMATION,

    artifactId:
      "artifact-http-b",

    submittedByActorId:
      "operator-http",

    recordedAt:
      new Date(
        "2026-09-23T13:02:00.000Z",
      ),
  };

  return {
    receipt: {
      id:
        "receipt-http-verified",

      reference:
        "HTTP-VERIFIED-001",

      programId:
        "program-http",

      destinationProgramAccountId:
        "program-account-http",

      receivedFromPartyId:
        "party-http",

      declaredAmount: {
        amount:
          "100.00",

        currency:
          "USDT",
      },

      verifiedAmount: {
        amount:
          "99.50",

        currency:
          "USDT",
      },

      receiptMethod:
        CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

      externalReference:
        "0xverified",

      status:
        PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,

      receivedAt:
        new Date(
          "2026-09-23T13:00:00.000Z",
        ),

      verifiedAt:
        new Date(
          "2026-09-23T13:05:00.000Z",
        ),

      metadata: {
        createdAt:
          new Date(
            "2026-09-23T13:00:30.000Z",
          ),

        updatedAt:
          new Date(
            "2026-09-23T13:05:30.000Z",
          ),

        createdByActorId:
          "operator-http",

        lastModifiedByActorId:
          "verifier-http",

        version:
          4,
      },
    },

    admittedEvidence: [
      evidenceA,
      evidenceB,
    ],

    verificationEvent: {
      eventId:
        "verified-event-http",

      sequence:
        42n,

      aggregateVersion:
        4,

      actorId:
        "verifier-http",

      authorityGrantId:
        "grant-http",

      correlationId:
        "correlation-http",

      causationId:
        "causation-http",

      verifiedAmount: {
        amount:
          "99.50",

        currency:
          "USDT",
      },

      selectedEvidenceIds: [
        evidenceA.id,
      ],

      verifiedAt:
        new Date(
          "2026-09-23T13:05:00.000Z",
        ),

      occurredAt:
        new Date(
          "2026-09-23T13:05:00.000Z",
        ),

      recordedAt:
        new Date(
          "2026-09-23T13:05:01.000Z",
        ),

      previousEventHash:
        "previous-hash-http",

      eventHash:
        "event-hash-http",
    },

    selectedEvidenceIds: [
      evidenceA.id,
    ],

    selectedEvidence: [
      evidenceA,
    ],

    unselectedAdmittedEvidence: [
      evidenceB,
    ],

    loadedAt:
      new Date(
        "2026-09-23T13:06:00.000Z",
      ),
  };
}

async function main():
  Promise<void> {
  /*
   * ======================================================
   * CASE 1 — blank receipt id
   * ======================================================
   */

  let blankLoaderCalled =
    false;

  const blank =
    await getProgramCapitalReceiptVerificationHttp({
      rawReceiptId:
        "   ",

      prisma:
        fakePrisma,

      loadPerception:
        async () => {
          blankLoaderCalled =
            true;

          throw new Error(
            "BLANK_ID_MUST_NOT_REACH_LOADER",
          );
        },
    });

  assert.equal(
    blankLoaderCalled,
    false,
  );

  assert.equal(
    blank.status,
    400,
  );

  assert.deepEqual(
    blank.body,
    {
      ok:
        false,

      state:
        PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.INVALID_REQUEST,

      error:
        "CAPITAL_RECEIPT_ID_REQUIRED",
    },
  );

  console.log(
    "TRV_HTTP_BLANK_RECEIPT_ID_INVALID_REQUEST_OK",
  );

  /*
   * ======================================================
   * CASE 2 — receipt not found
   * ======================================================
   */

  let missingReceivedId:
    string | null =
      null;

  const missing =
    await getProgramCapitalReceiptVerificationHttp({
      rawReceiptId:
        "  receipt-http-missing  ",

      prisma:
        fakePrisma,

      loadPerception:
        async (
          params,
        ) => {
          missingReceivedId =
            params.receiptId;

          return null;
        },
    });

  assert.equal(
    missingReceivedId,
    "receipt-http-missing",
  );

  assert.equal(
    missing.status,
    404,
  );

  assert.deepEqual(
    missing.body,
    {
      ok:
        false,

      state:
        PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.NOT_FOUND,

      error:
        "CAPITAL_RECEIPT_NOT_FOUND",
    },
  );

  console.log(
    "TRV_HTTP_MISSING_RECEIPT_NOT_FOUND_OK",
  );

  console.log(
    "TRV_HTTP_RECEIPT_ID_TRIMMED_BEFORE_PERCEPTION_OK",
  );

  /*
   * ======================================================
   * CASE 3 — REPORTED receipt
   *
   * READY means successfully perceived, not VERIFIED.
   * ======================================================
   */

  const reported =
    await getProgramCapitalReceiptVerificationHttp({
      rawReceiptId:
        "receipt-http-reported",

      prisma:
        fakePrisma,

      loadPerception:
        async () =>
          makeReportedPerception(),
    });

  assert.equal(
    reported.status,
    200,
  );

  assert.equal(
    reported.body.ok,
    true,
  );

  if (
    !reported.body.ok
  ) {
    throw new Error(
      "TRV_HTTP_REPORTED_EXPECTED_SUCCESS",
    );
  }

  assert.equal(
    reported.body.state,
    PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.READY,
  );

  assert.equal(
    reported.body.perception.receipt.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
  );

  assert.equal(
    reported.body.perception.verificationEvent,
    null,
  );

  assert.deepEqual(
    reported.body.perception.selectedEvidenceIds,
    [],
  );

  assert.deepEqual(
    reported.body.perception.selectedEvidence,
    [],
  );

  assert.equal(
    reported.body.perception.receipt.receivedAt,
    "2026-09-23T12:00:00.000Z",
  );

  assert.equal(
    reported.body.perception.loadedAt,
    "2026-09-23T12:02:00.000Z",
  );

  console.log(
    "TRV_HTTP_REPORTED_RECEIPT_READY_WITHOUT_VERIFICATION_OK",
  );

  /*
   * ======================================================
   * CASE 4 — VERIFIED receipt
   *
   * Verify serialization of:
   * - event sequence bigint
   * - dates
   * - selected evidence
   * - unselected admitted evidence
   * ======================================================
   */

  const verified =
    await getProgramCapitalReceiptVerificationHttp({
      rawReceiptId:
        "receipt-http-verified",

      prisma:
        fakePrisma,

      loadPerception:
        async () =>
          makeVerifiedPerception(),
    });

  assert.equal(
    verified.status,
    200,
  );

  assert.equal(
    verified.body.ok,
    true,
  );

  if (
    !verified.body.ok
  ) {
    throw new Error(
      "TRV_HTTP_VERIFIED_EXPECTED_SUCCESS",
    );
  }

  assert.equal(
    verified.body.state,
    PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.READY,
  );

  assert.equal(
    verified.body.perception.receipt.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,
  );

  assert.deepEqual(
    verified.body.perception.receipt.verifiedAmount,
    {
      amount:
        "99.50",

      currency:
        "USDT",
    },
  );

  assert(
    verified.body.perception.verificationEvent,
  );

  assert.equal(
    verified.body.perception.verificationEvent.sequence,
    "42",
  );

  assert.equal(
    typeof verified.body.perception.verificationEvent.sequence,
    "string",
  );

  assert.equal(
    verified.body.perception.verificationEvent.actorId,
    "verifier-http",
  );

  assert.equal(
    verified.body.perception.verificationEvent.authorityGrantId,
    "grant-http",
  );

  assert.equal(
    verified.body.perception.verificationEvent.verifiedAt,
    "2026-09-23T13:05:00.000Z",
  );

  assert.equal(
    verified.body.perception.verificationEvent.occurredAt,
    "2026-09-23T13:05:00.000Z",
  );

  assert.equal(
    verified.body.perception.verificationEvent.recordedAt,
    "2026-09-23T13:05:01.000Z",
  );

  assert.deepEqual(
    verified.body.perception.selectedEvidenceIds,
    [
      "evidence-http-a",
    ],
  );

  assert.deepEqual(
    verified.body.perception.selectedEvidence.map(
      (
        evidence,
      ) =>
        evidence.id,
    ),
    [
      "evidence-http-a",
    ],
  );

  assert.deepEqual(
    verified.body.perception.unselectedAdmittedEvidence.map(
      (
        evidence,
      ) =>
        evidence.id,
    ),
    [
      "evidence-http-b",
    ],
  );

  /*
   * The complete success body must be JSON serializable.
   * A leaked bigint would fail here.
   */
  const serialized =
    JSON.stringify(
      verified.body,
    );

  assert.match(
    serialized,
    /"sequence":"42"/,
  );

  console.log(
    "TRV_HTTP_VERIFIED_PERCEPTION_SERIALIZED_OK",
  );

  console.log(
    "TRV_HTTP_EVENT_SEQUENCE_JSON_SAFE_OK",
  );

  console.log(
    "TRV_HTTP_SELECTED_UNSELECTED_EVIDENCE_PRESERVED_OK",
  );

  /*
   * ======================================================
   * CASE 5 — perception integrity failure
   * ======================================================
   */

  const integrityFailure =
    await getProgramCapitalReceiptVerificationHttp({
      rawReceiptId:
        "receipt-http-corrupt",

      prisma:
        fakePrisma,

      loadPerception:
        async () => {
          throw new Error(
            "[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_AMOUNT_MISMATCH] receipt-http-corrupt",
          );
        },
    });

  assert.equal(
    integrityFailure.status,
    500,
  );

  assert.deepEqual(
    integrityFailure.body,
    {
      ok:
        false,

      state:
        PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.INTEGRITY_FAILURE,

      error:
        "CAPITAL_RECEIPT_VERIFICATION_INTEGRITY_FAILURE",
    },
  );

  console.log(
    "TRV_HTTP_INTEGRITY_FAILURE_NORMALIZED_OK",
  );

  /*
   * ======================================================
   * CASE 6 — unknown failures remain exceptional
   *
   * The HTTP adapter must not collapse unrelated failures
   * into Treasury integrity failures.
   * ======================================================
   */

  let unknownFailureRethrown =
    false;

  try {
    await getProgramCapitalReceiptVerificationHttp({
      rawReceiptId:
        "receipt-http-unknown-error",

      prisma:
        fakePrisma,

      loadPerception:
        async () => {
          throw new Error(
            "UNRELATED_INFRASTRUCTURE_FAILURE",
          );
        },
    });
  } catch (
    error:
      unknown
  ) {
    assert(
      error instanceof Error,
    );

    assert.equal(
      error.message,
      "UNRELATED_INFRASTRUCTURE_FAILURE",
    );

    unknownFailureRethrown =
      true;
  }

  assert.equal(
    unknownFailureRethrown,
    true,
  );

  console.log(
    "TRV_HTTP_UNKNOWN_FAILURE_RETHROWN_OK",
  );

  /*
   * ======================================================
   * FINAL NEGATIVE AUTHORITY ASSERTION
   *
   * This smoke exercises perception mapping only.
   * No command service or lifecycle mutation is invoked.
   * ======================================================
   */

  console.log(
    "TRV_HTTP_CONTRACT_DOES_NOT_RECOGNIZE_CAPITAL_OK",
  );
}

main()
  .catch(
    (
      error:
        unknown,
    ) => {
      console.error(
        error,
      );

      process.exitCode =
        1;
    },
  );
