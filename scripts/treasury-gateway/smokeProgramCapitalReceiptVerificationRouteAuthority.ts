import assert from "node:assert/strict";

import {
  readFile,
} from "node:fs/promises";

const ROUTE =
  "app/api/admin/control-center/treasury/capital-receipts/[receiptId]/verification/route.ts";

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
    /export async function GET\s*\(/,
  );

  assert.doesNotMatch(
    source,
    /export async function (POST|PUT|PATCH|DELETE)\s*\(/,
  );

  console.log(
    "TRV_ROUTE_AUTH_GET_ONLY_OK",
  );

  /*
   * ======================================================
   * EXACT READ AUTHORITY
   * ======================================================
   */

  assert.match(
    source,
    /requirePermission\s*\(\s*PERMISSIONS\.TREASURY_READ\s*,?\s*\)/s,
  );

  assert.equal(
    count(
      source,
      "PERMISSIONS.TREASURY_READ",
    ),
    2,
    "TREASURY_READ should appear once in authorization and once in the missing-permission normalization branch",
  );

  const forbiddenAuthorities = [
    "TREASURY_ORIGINATE",
    "TREASURY_REVIEW",
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
    "TRV_ROUTE_AUTH_TREASURY_READ_ONLY_OK",
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
    "TRV_ROUTE_AUTH_UNAUTHENTICATED_401_CONTRACT_OK",
  );

  /*
   * ======================================================
   * PERMISSION-DENIED NORMALIZATION
   * ======================================================
   */

  assert.match(
    source,
    /MISSING_PERMISSION:\$\{PERMISSIONS\.TREASURY_READ\}/s,
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
    "TRV_ROUTE_AUTH_PERMISSION_DENIED_403_CONTRACT_OK",
  );

  /*
   * ======================================================
   * UNKNOWN AUTH FAILURES MUST ESCAPE
   * ======================================================
   */

  assert.match(
    source,
    /throw error;/,
  );

  console.log(
    "TRV_ROUTE_AUTH_UNKNOWN_FAILURE_RETHROWN_OK",
  );

  /*
   * ======================================================
   * ROUTE IDENTITY
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
    "TRV_ROUTE_AUTH_RECEIPT_ID_ROUTE_BOUNDARY_OK",
  );

  /*
   * ======================================================
   * CANONICAL HTTP ADAPTER DELEGATION
   * ======================================================
   */

  assert.equal(
    count(
      source,
      "getProgramCapitalReceiptVerificationHttp({",
    ),
    1,
  );

  assert.match(
    source,
    /getProgramCapitalReceiptVerificationHttp\(\{\s*rawReceiptId:\s*receiptId,\s*prisma,\s*\}\)/s,
  );

  console.log(
    "TRV_ROUTE_AUTH_CANONICAL_HTTP_ADAPTER_DELEGATION_OK",
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
    "TRV_ROUTE_AUTH_HTTP_RESULT_PASSTHROUGH_OK",
  );

  /*
   * ======================================================
   * NEGATIVE AUTHORITY ASSERTIONS
   * ======================================================
   */

  const forbiddenMutationTerms = [
    "IdempotentlyWithClient",
    "DurablyWithClient",
    "verifyProgramCapitalReceipt(",
    "recognizeProgramCapital(",
    "create(",
    "update(",
    "upsert(",
    "delete(",
  ];

  for (
    const term of
      forbiddenMutationTerms
  ) {
    assert.equal(
      source.includes(
        term,
      ),
      false,
      `Route unexpectedly contains mutation authority: ${term}`,
    );
  }

  console.log(
    "TRV_ROUTE_AUTH_NO_MUTATION_AUTHORITY_OK",
  );

  console.log(
    "TRV_ROUTE_AUTH_DOES_NOT_RECOGNIZE_CAPITAL_OK",
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
