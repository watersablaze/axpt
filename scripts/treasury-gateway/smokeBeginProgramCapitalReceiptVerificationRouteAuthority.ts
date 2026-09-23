import assert from "node:assert/strict";

import {
  readFile,
} from "node:fs/promises";

const ROUTE =
  "app/api/admin/control-center/treasury/capital-receipts/[receiptId]/verification/start/route.ts";

function count(
  source:
    string,

  fragment:
    string,
): number {
  return source
    .split(fragment)
    .length - 1;
}

async function main():
  Promise<void> {
  const source =
    await readFile(
      ROUTE,
      "utf8",
    );

  /*
   * ======================================================
   * ROUTE SHAPE
   * ======================================================
   */

  assert.match(
    source,
    /export async function POST\s*\(/,
  );

  assert.doesNotMatch(
    source,
    /export async function (GET|PUT|PATCH|DELETE)\s*\(/,
  );

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_POST_ONLY_OK",
  );

  /*
   * ======================================================
   * EXACT REVIEW AUTHORITY
   * ======================================================
   */

  assert.match(
    source,
    /requirePermission\s*\(\s*PERMISSIONS\.TREASURY_REVIEW\s*,?\s*\)/s,
  );

  assert.equal(
    count(
      source,
      "PERMISSIONS.TREASURY_REVIEW",
    ),
    2,
    "TREASURY_REVIEW should appear once in authorization and once in missing-permission normalization",
  );

  const forbiddenAuthorities = [
    "TREASURY_ORIGINATE",
    "TREASURY_ASSESS",
    "TREASURY_APPROVE",
    "TREASURY_QUEUE_PROCESS",
    "TREASURY_PAUSE",
    "TREASURY_SYNC",
    "TREASURY_EXECUTE",
    "TREASURY_EXECUTE_INTENT",
    "TREASURY_RUN_AUTONOMOUS_LOOP",
  ];

  for (
    const permission of
      forbiddenAuthorities
  ) {
    assert.equal(
      source.includes(
        `PERMISSIONS.${permission}`,
      ),
      false,
      `Unexpected route authority: ${permission}`,
    );
  }

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_TREASURY_REVIEW_ONLY_OK",
  );

  /*
   * ======================================================
   * UNAUTHENTICATED NORMALIZATION
   * ======================================================
   */

  assert.match(
    source,
    /error\.message ===\s*"Authentication required"/s,
  );

  assert.match(
    source,
    /PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE\.UNAUTHENTICATED/s,
  );

  assert.match(
    source,
    /error:\s*"UNAUTHORIZED"/s,
  );

  assert.match(
    source,
    /status:\s*401/s,
  );

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_UNAUTHENTICATED_401_CONTRACT_OK",
  );

  /*
   * ======================================================
   * PERMISSION-DENIED NORMALIZATION
   * ======================================================
   */

  assert.match(
    source,
    /MISSING_PERMISSION:\$\{PERMISSIONS\.TREASURY_REVIEW\}/s,
  );

  assert.match(
    source,
    /PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE\.PERMISSION_DENIED/s,
  );

  assert.match(
    source,
    /error:\s*"FORBIDDEN"/s,
  );

  assert.match(
    source,
    /status:\s*403/s,
  );

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_PERMISSION_DENIED_403_CONTRACT_OK",
  );

  /*
   * ======================================================
   * UNKNOWN AUTH FAILURES ESCAPE
   * ======================================================
   */

  assert.match(
    source,
    /throw error;/,
  );

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_UNKNOWN_FAILURE_RETHROWN_OK",
  );

  /*
   * ======================================================
   * RECEIPT IDENTITY
   * ======================================================
   */

  assert.match(
    source,
    /params:\s*Promise<\{\s*receiptId:/s,
  );

  assert.match(
    source,
    /const\s*\{\s*receiptId,\s*\}\s*=\s*await context\.params;/s,
  );

  assert.match(
    source,
    /rawReceiptId:\s*receiptId/s,
  );

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_RECEIPT_ID_BOUNDARY_OK",
  );

  /*
   * ======================================================
   * REQUEST + PRINCIPAL DELEGATION
   * ======================================================
   */

  assert.equal(
    count(
      source,
      "beginProgramCapitalReceiptVerificationHttp({",
    ),
    1,
  );

  assert.match(
    source,
    /beginProgramCapitalReceiptVerificationHttp\(\{\s*rawReceiptId:\s*receiptId,\s*request,\s*principal,\s*prisma,\s*\}\)/s,
  );

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_REQUEST_PRINCIPAL_DELEGATION_OK",
  );

  /*
   * ======================================================
   * RESPONSE PASS-THROUGH
   * ======================================================
   */

  assert.match(
    source,
    /NextResponse\.json\(\s*result\.body,\s*\{\s*status:\s*result\.status,\s*\}\s*,?\s*\)/s,
  );

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_HTTP_RESULT_PASSTHROUGH_OK",
  );

  /*
   * ======================================================
   * NEGATIVE LIFECYCLE AUTHORITY
   * ======================================================
   */

  const forbiddenLifecycleTerms = [
    "admitProgramCapitalReceiptEvidence",
    "verifyProgramCapitalReceipt",
    "recognizeProgramCapital",
    "CAPITAL_RECEIPT_EVIDENCE_ADMITTED",
    "CAPITAL_RECEIPT_VERIFIED",
    "PROGRAM_CAPITAL_RECOGNIZED",
  ];

  for (
    const term of
      forbiddenLifecycleTerms
  ) {
    assert.equal(
      source.includes(
        term,
      ),
      false,
      `Unexpected lifecycle authority in route: ${term}`,
    );
  }

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_NO_EVIDENCE_JUDGMENT_RECOGNITION_OK",
  );

  /*
   * ======================================================
   * ROUTE MUST NOT ACCEPT ACTOR IDENTITY FROM REQUEST BODY
   * ======================================================
   */

  assert.equal(
    source.includes(
      "actorId:",
    ),
    false,
  );

  assert.equal(
    source.includes(
      "userId:",
    ),
    false,
  );

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_NO_CLIENT_SUPPLIED_ACTOR_OK",
  );

  console.log(
    "TRV_BEGIN_ROUTE_AUTH_STOPS_AT_VERIFICATION_START_OK",
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
