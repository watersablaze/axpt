import assert from "node:assert/strict";

import {
  readFileSync,
} from "node:fs";

import {
  resolve,
} from "node:path";

const PANEL =
  "src/components/admin/control-center/treasury/DigitalSettlementReceiptAdmissionPanel.tsx";

function readSource(
  path:
    string,
): string {
  return readFileSync(
    resolve(
      process.cwd(),
      path,
    ),
    "utf8",
  );
}

function assertContains(
  source:
    string,

  token:
    string,

  label:
    string,
): void {
  assert.equal(
    source.includes(
      token,
    ),
    true,
    label,
  );
}

function assertAbsent(
  source:
    string,

  token:
    string,

  label:
    string,
): void {
  assert.equal(
    source.includes(
      token,
    ),
    false,
    label,
  );
}

function countOccurrences(
  source:
    string,

  token:
    string,
): number {
  return source
    .split(
      token,
    )
    .length - 1;
}

function extractJsonBody(
  source:
    string,
): string {
  const startToken =
    "JSON.stringify({";

  const endToken =
    "}),";

  const start =
    source.indexOf(
      startToken,
    );

  assert.notEqual(
    start,
    -1,
    "RB1C8E3_JSON_BODY_START_MISSING",
  );

  const end =
    source.indexOf(
      endToken,
      start,
    );

  assert.notEqual(
    end,
    -1,
    "RB1C8E3_JSON_BODY_END_MISSING",
  );

  return source.slice(
    start,
    end +
      endToken.length,
  );
}

async function main():
  Promise<void> {
  const source =
    readSource(
      PANEL,
    );

  /*
   * --------------------------------------------------------
   * CANONICAL STATE VOCABULARY
   * --------------------------------------------------------
   */

  const canonicalStates = [
    "INVALID_REQUEST",
    "NOT_FOUND",
    "RECOGNITION_NOT_READY",
    "REPORTABLE",
    "ALREADY_REPORTED",
    "ROUTING_COLLISION",
    "INTEGRITY_FAILURE",
    "UNAUTHENTICATED",
    "PERMISSION_DENIED",
  ] as const;

  for (
    const state of canonicalStates
  ) {
    assertContains(
      source,
      `DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.${state}`,
      `RB1C8E3_STATE_NOT_REPRESENTED:${state}`,
    );
  }

  /*
   * --------------------------------------------------------
   * REPORTABLE IS THE SOLE ACTION GATE
   * --------------------------------------------------------
   */

  const reportableGate =
    "DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.REPORTABLE ? (";

  assert.equal(
    countOccurrences(
      source,
      reportableGate,
    ),
    1,
    "RB1C8E3_REPORTABLE_GATE_COUNT_INVALID",
  );

  assertContains(
    source,
    '<form',
    "RB1C8E3_REPORT_FORM_MISSING",
  );

  assertContains(
    source,
    "Treasury Admission Not Actionable",
    "RB1C8E3_NON_REPORTABLE_BLOCKED_SURFACE_MISSING",
  );

  assertContains(
    source,
    "STATE MUST BE REPORTABLE",
    "RB1C8E3_REPORTABLE_REQUIREMENT_MISSING",
  );

  /*
   * --------------------------------------------------------
   * ALREADY_REPORTED IS READ-ONLY
   * --------------------------------------------------------
   */

  assertContains(
    source,
    "DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.ALREADY_REPORTED",
    "RB1C8E3_ALREADY_REPORTED_STATE_MISSING",
  );

  assertContains(
    source,
    "Read Only Treasury State",
    "RB1C8E3_ALREADY_REPORTED_READ_ONLY_SURFACE_MISSING",
  );

  assertContains(
    source,
    "RECEIPT ALREADY ADMITTED",
    "RB1C8E3_ALREADY_REPORTED_DOCTRINE_MISSING",
  );

  /*
   * --------------------------------------------------------
   * HIGH-RISK NON-ACTIONABLE STATES ARE REPRESENTED
   * AND CANNOT THEMSELVES GATE THE FORM.
   * --------------------------------------------------------
   */

  const prohibitedActionStates = [
    "ROUTING_COLLISION",
    "INTEGRITY_FAILURE",
    "UNAUTHENTICATED",
    "PERMISSION_DENIED",
  ] as const;

  for (
    const state of prohibitedActionStates
  ) {
    assertContains(
      source,
      `DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.${state}`,
      `RB1C8E3_BLOCKED_STATE_MISSING:${state}`,
    );

    assertAbsent(
      source,
      `DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.${state} ? (`,
      `RB1C8E3_BLOCKED_STATE_EXPOSES_ACTION:${state}`,
    );
  }

  /*
   * --------------------------------------------------------
   * NETWORK FAILURE MUST NOT CLAIM CANONICAL STATE
   * --------------------------------------------------------
   */

  assertContains(
    source,
    "setAdmissionState(\n        null,",
    "RB1C8E3_NETWORK_UNCERTAINTY_STATE_CLEAR_MISSING",
  );

  /*
   * --------------------------------------------------------
   * BROWSER REQUEST AUTHORITY SURFACE
   * --------------------------------------------------------
   */

  const jsonBody =
    extractJsonBody(
      source,
    );

  const permittedBrowserFields = [
    "programId:",
    "destinationProgramAccountId:",
    "authorityGrantId:",
  ] as const;

  for (
    const field of permittedBrowserFields
  ) {
    assertContains(
      jsonBody,
      field,
      `RB1C8E3_ALLOWED_BROWSER_FIELD_MISSING:${field}`,
    );
  }

  /*
   * The browser may propose routing.
   * It may not supply institutional source truth,
   * actor identity, or downstream Treasury state.
   */
  const forbiddenBrowserFields = [
    "actorId",
    "treasuryActorId",
    "operatorId",
    "principalId",
    "observationId",
    "recognitionEventId",
    "instrumentVersionId",
    "transactionHash",
    "tokenContractAddress",
    "receivingAddress",
    "amount:",
    "declaredAmount",
    "receivedAt",
    "recognizedAt",
    "receiptStatus",
    "status:",
    "verificationStatus",
    "capitalStatus",
    "availableAmount",
    "executionId",
  ] as const;

  for (
    const field of forbiddenBrowserFields
  ) {
    assertAbsent(
      jsonBody,
      field,
      `RB1C8E3_FORBIDDEN_BROWSER_AUTHORITY_FIELD:${field}`,
    );
  }

  /*
   * --------------------------------------------------------
   * UI MUST NOT CONTAIN DOWNSTREAM TREASURY COMMANDS
   * --------------------------------------------------------
   */

  const forbiddenAuthorityOperations = [
    "beginProgramCapitalReceiptVerification",
    "admitProgramCapitalReceiptEvidence",
    "verifyProgramCapitalReceipt",
    "recognizeProgramCapital",
    "makeProgramCapitalAvailable",
    "allocateProgramCapital",
    "executeTreasuryInstruction",
  ] as const;

  for (
    const operation of forbiddenAuthorityOperations
  ) {
    assertAbsent(
      source,
      operation,
      `RB1C8E3_UI_DOWNSTREAM_AUTHORITY_FOUND:${operation}`,
    );
  }

  /*
   * --------------------------------------------------------
   * UI MUST NOT FALL BACK TO LEGACY ERROR-CODE DISPLAY
   * --------------------------------------------------------
   */

  assertAbsent(
    source,
    "formatError(",
    "RB1C8E3_LEGACY_GENERIC_ERROR_FORMATTER_FOUND",
  );

  /*
   * --------------------------------------------------------
   * CANONICAL STATE MUST COME FROM BACKEND PAYLOADS
   * --------------------------------------------------------
   */

  assert.equal(
    countOccurrences(
      source,
      "payload.state",
    ) >= 4,
    true,
    "RB1C8E3_BACKEND_STATE_BINDINGS_INSUFFICIENT",
  );

  console.log(
    "DSI_TREASURY_UI_ALL_CANONICAL_STATES_REPRESENTED_OK",
  );

  console.log(
    "DSI_TREASURY_UI_REPORTABLE_ONLY_ACTION_GATE_OK",
  );

  console.log(
    "DSI_TREASURY_UI_ALREADY_REPORTED_READ_ONLY_OK",
  );

  console.log(
    "DSI_TREASURY_UI_COLLISION_INTEGRITY_AUTH_FAIL_CLOSED_OK",
  );

  console.log(
    "DSI_TREASURY_UI_NETWORK_UNCERTAINTY_NO_STATE_CLAIM_OK",
  );

  console.log(
    "DSI_TREASURY_UI_ROUTING_ONLY_BROWSER_REQUEST_OK",
  );

  console.log(
    "DSI_TREASURY_UI_SOURCE_TRUTH_NOT_BROWSER_SUPPLIED_OK",
  );

  console.log(
    "DSI_TREASURY_UI_NO_DOWNSTREAM_AUTHORITY_OK",
  );

  console.log(
    "DSI_TREASURY_UI_BACKEND_STATE_DRIVES_PERCEPTION_OK",
  );
}

main();
