import assert from "node:assert/strict";

import {
  readFileSync,
} from "node:fs";

import {
  resolve,
} from "node:path";

const GET_ROUTE =
  "app/api/admin/control-center/treasury/dsi-receipts/[reference]/route.ts";

const POST_ROUTE =
  "app/api/admin/control-center/treasury/dsi-receipts/[reference]/report/route.ts";

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
  params: {
    source:
      string;

    token:
      string;

    label:
      string;
  },
): void {
  assert.equal(
    params.source.includes(
      params.token,
    ),
    true,
    params.label,
  );
}

function assertOrdered(
  params: {
    source:
      string;

    before:
      string;

    after:
      string;

    label:
      string;
  },
): void {
  const beforeIndex =
    params.source.indexOf(
      params.before,
    );

  const afterIndex =
    params.source.indexOf(
      params.after,
    );

  assert.notEqual(
    beforeIndex,
    -1,
    `${params.label}:before-missing`,
  );

  assert.notEqual(
    afterIndex,
    -1,
    `${params.label}:after-missing`,
  );

  assert.equal(
    beforeIndex <
      afterIndex,
    true,
    params.label,
  );
}

function assertAbsent(
  params: {
    source:
      string;

    token:
      string;

    label:
      string;
  },
): void {
  assert.equal(
    params.source.includes(
      params.token,
    ),
    false,
    params.label,
  );
}

async function main():
  Promise<void> {
  const getSource =
    readSource(
      GET_ROUTE,
    );

  const postSource =
    readSource(
      POST_ROUTE,
    );

  /*
   * GET authority:
   * TREASURY_READ remains the required capability.
   */
  assertContains({
    source:
      getSource,

    token:
      "PERMISSIONS.TREASURY_READ",

    label:
      "RB1C8D_GET_READ_PERMISSION_MISSING",
  });

  /*
   * No principal:
   * route normalizes requirePrincipal()'s canonical
   * error into an operator-safe 401 state.
   */
  assertContains({
    source:
      getSource,

    token:
      '"Authentication required"',

    label:
      "RB1C8D_GET_UNAUTHENTICATED_SOURCE_MISSING",
  });

  assertContains({
    source:
      getSource,

    token:
      "DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.UNAUTHENTICATED",

    label:
      "RB1C8D_GET_UNAUTHENTICATED_STATE_MISSING",
  });

  assertContains({
    source:
      getSource,

    token:
      '"UNAUTHORIZED"',

    label:
      "RB1C8D_GET_UNAUTHORIZED_ERROR_MISSING",
  });

  assertContains({
    source:
      getSource,

    token:
      "401",

    label:
      "RB1C8D_GET_401_MISSING",
  });

  /*
   * Principal without TREASURY_READ:
   * route normalizes requirePermission() into 403.
   */
  assertContains({
    source:
      getSource,

    token:
      "MISSING_PERMISSION:${PERMISSIONS.TREASURY_READ}",

    label:
      "RB1C8D_GET_PERMISSION_FAILURE_SOURCE_MISSING",
  });

  assertContains({
    source:
      getSource,

    token:
      "DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.PERMISSION_DENIED",

    label:
      "RB1C8D_GET_PERMISSION_DENIED_STATE_MISSING",
  });

  assertContains({
    source:
      getSource,

    token:
      '"FORBIDDEN"',

    label:
      "RB1C8D_GET_FORBIDDEN_ERROR_MISSING",
  });

  assertContains({
    source:
      getSource,

    token:
      "403",

    label:
      "RB1C8D_GET_403_MISSING",
  });

  /*
   * Successful GET authorization must proceed to the
   * existing perception handler only after permission
   * enforcement.
   */
  assertOrdered({
    source:
      getSource,

    before:
      "await requirePermission(",

    after:
      "await getDigitalSettlementRecognitionReceiptCandidateHttp({",

    label:
      "RB1C8D_GET_HANDLER_NOT_BEHIND_AUTHORITY",
  });

  /*
   * POST authority:
   * TREASURY_ORIGINATE remains the required capability.
   */
  assertContains({
    source:
      postSource,

    token:
      "PERMISSIONS.TREASURY_ORIGINATE",

    label:
      "RB1C8D_POST_ORIGINATE_PERMISSION_MISSING",
  });

  assertContains({
    source:
      postSource,

    token:
      '"Authentication required"',

    label:
      "RB1C8D_POST_UNAUTHENTICATED_SOURCE_MISSING",
  });

  assertContains({
    source:
      postSource,

    token:
      "DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.UNAUTHENTICATED",

    label:
      "RB1C8D_POST_UNAUTHENTICATED_STATE_MISSING",
  });

  assertContains({
    source:
      postSource,

    token:
      '"UNAUTHORIZED"',

    label:
      "RB1C8D_POST_UNAUTHORIZED_ERROR_MISSING",
  });

  assertContains({
    source:
      postSource,

    token:
      "401",

    label:
      "RB1C8D_POST_401_MISSING",
  });

  assertContains({
    source:
      postSource,

    token:
      "MISSING_PERMISSION:${PERMISSIONS.TREASURY_ORIGINATE}",

    label:
      "RB1C8D_POST_PERMISSION_FAILURE_SOURCE_MISSING",
  });

  assertContains({
    source:
      postSource,

    token:
      "DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.PERMISSION_DENIED",

    label:
      "RB1C8D_POST_PERMISSION_DENIED_STATE_MISSING",
  });

  assertContains({
    source:
      postSource,

    token:
      '"FORBIDDEN"',

    label:
      "RB1C8D_POST_FORBIDDEN_ERROR_MISSING",
  });

  assertContains({
    source:
      postSource,

    token:
      "403",

    label:
      "RB1C8D_POST_403_MISSING",
  });

  /*
   * Successful POST authorization must preserve the
   * authenticated Principal and pass it to the existing
   * reporting handler.
   */
  assertOrdered({
    source:
      postSource,

    before:
      "principal =",

    after:
      "await reportDigitalSettlementRecognitionReceiptHttp({",

    label:
      "RB1C8D_POST_HANDLER_NOT_BEHIND_AUTHORITY",
  });

  assertContains({
    source:
      postSource,

    token:
      "principal,",

    label:
      "RB1C8D_POST_PRINCIPAL_NOT_FORWARDED",
  });

  /*
   * Unknown auth failures remain exceptional.
   * Route normalization must not swallow arbitrary faults.
   */
  assertContains({
    source:
      getSource,

    token:
      "throw error;",

    label:
      "RB1C8D_GET_UNEXPECTED_AUTH_FAILURE_NOT_RETHROWN",
  });

  assertContains({
    source:
      postSource,

    token:
      "throw error;",

    label:
      "RB1C8D_POST_UNEXPECTED_AUTH_FAILURE_NOT_RETHROWN",
  });

  /*
   * Admission routes remain incapable of downstream
   * Treasury verification / recognition.
   */
  for (
    const token of [
      "beginProgramCapitalReceiptVerification",
      "admitProgramCapitalReceiptEvidence",
      "verifyProgramCapitalReceipt",
      "recognizeProgramCapital",
    ]
  ) {
    assertAbsent({
      source:
        getSource,

      token,

      label:
        `RB1C8D_GET_DOWNSTREAM_AUTHORITY_FOUND:${token}`,
    });

    assertAbsent({
      source:
        postSource,

      token,

      label:
        `RB1C8D_POST_DOWNSTREAM_AUTHORITY_FOUND:${token}`,
    });
  }

  console.log(
    "DSI_TREASURY_ROUTE_GET_TREASURY_READ_AUTHORITY_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTE_GET_UNAUTHENTICATED_401_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTE_GET_PERMISSION_DENIED_403_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTE_GET_HANDLER_BEHIND_AUTHORITY_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTE_POST_TREASURY_ORIGINATE_AUTHORITY_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTE_POST_UNAUTHENTICATED_401_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTE_POST_PERMISSION_DENIED_403_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTE_POST_PRINCIPAL_FORWARDED_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTE_UNEXPECTED_AUTH_FAILURE_RETHROWN_OK",
  );

  console.log(
    "DSI_TREASURY_ROUTE_NO_DOWNSTREAM_AUTHORITY_OK",
  );
}

main();
