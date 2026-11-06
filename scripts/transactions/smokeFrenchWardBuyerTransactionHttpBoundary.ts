import assert from "node:assert/strict";

import {
  createFrenchWardBuyerTransactionPost,
} from "../../src/domains/control-center/transaction-intakes/createFrenchWardBuyerTransactionPost";

import {
  FRENCH_WARD_ACTION,
} from "../../src/domains/institutions/french-ward/governance/resolveFrenchWardActionAuthorityWithClient";

import {
  FRENCH_WARD_REGISTER_BUYER_TRANSACTION_CONFIRMATION,
} from "../../src/domains/control-center/transaction-intakes/registerFrenchWardBuyerTransactionWithCustody";

const endpoint =
  "http://127.0.0.1:3143/api/french-ward/home/actions/register-buyer-transaction";

const origin =
  "http://127.0.0.1:3143";

const principal = {
  userId:
    "fw-governing-http-test-user",

  email:
    "officer@fw-http-test.invalid",

  displayName:
    "Synthetic Governing Officer",

  roles:
    [],

  permissions:
    [],

  sessionId:
    "fw-http-session-test",
};

const governingStanding = {
  reference:
    "FW-GOV-HTTP-TEST-001",

  userId:
    principal.userId,

  displayName:
    principal.displayName,

  institutionalTitle:
    "Synthetic Officer",

  secondaryTitle:
    null,

  governingBasis:
    "Synthetic governing record",

  provenanceReference:
    null,

  status:
    "ACTIVE",

  recognizedAt:
    new Date(
      "2026-11-05T00:00:00.000Z",
    ),

  endedAt:
    null,

  active:
    true,
};

const storageConfig = {
  endpoint:
    "https://storage.example.test",

  region:
    "test-region",

  accessKeyId:
    "synthetic",

  secretAccessKey:
    "synthetic",

  bucket:
    "fw-http-test",
};

const evidenceBytes =
  new TextEncoder().encode(
    "%PDF-1.7\nSYNTHETIC FW GOVERNING HTTP REGRESSION\n%%EOF",
  );

function registrationForm(
  options: {
    includeConfirmation?: boolean;
    confirmation?: string;
    operationalReference?: string;
    purposeVariant?: string;
  } = {},
) {
  const form =
    new FormData();

  form.set(
    "operationalReference",
    options.operationalReference ??
      "FW-TXN-HTTP-SYNTHETIC-001",
  );

  form.set(
    "submitterName",
    "Synthetic Introducer",
  );

  form.set(
    "submitterEmail",
    "introducer@fw-http-test.invalid",
  );

  form.set(
    "submitterRole",
    "INTERMEDIARY_UNVERIFIED",
  );

  form.set(
    "buyerName",
    "SYNTHETIC BUYER - NOT LIVE",
  );

  form.set(
    "commodity",
    "Gold Dore",
  );

  form.set(
    "trialQuantity",
    "50 kg",
  );

  form.set(
    "monthlyQuantity",
    "100 kg",
  );

  form.set(
    "destination",
    "Synthetic Destination",
  );

  form.set(
    "originatingCandidateName",
    "Synthetic Originator",
  );

  form.set(
    "introductionChannelName",
    "Synthetic Introduction Channel",
  );

  form.set(
    "deliveryTerms",
    options.purposeVariant ??
      "Proposed, not accepted",
  );

  form.set(
    "settlementMethod",
    "Unverified",
  );

  if (
    options.includeConfirmation
  ) {
    form.set(
      "confirmation",
      options.confirmation ??
        "BROWSER MUST NOT OWN THIS",
    );
  }

  form.set(
    "evidencePdf",
    new File(
      [evidenceBytes],
      "synthetic-registration.pdf",
      {
        type:
          "application/pdf",
      },
    ),
  );

  return form;
}

function requestFrom(
  form: FormData,
  requestOrigin = origin,
) {
  return new Request(
    endpoint,
    {
      method:
        "POST",

      headers: {
        Origin:
          requestOrigin,
      },

      body:
        form,
    },
  );
}

async function json(
  response: Response,
) {
  return await response.json() as
    Record<string, any>;
}

type HarnessOptions = {
  authenticated?: boolean;
  allowed?: boolean;
  storageAvailable?: boolean;
  alreadyRegistered?: boolean;
  wrapperError?: string | null;
};

function harness(
  options: HarnessOptions = {},
) {
  const authenticated =
    options.authenticated ?? true;

  const allowed =
    options.allowed ?? true;

  const storageAvailable =
    options.storageAvailable ?? true;

  const alreadyRegistered =
    options.alreadyRegistered ?? false;

  const wrapperError =
    options.wrapperError ?? null;

  const calls = {
    authority:
      0,

    storageConfig:
      0,

    storeFactory:
      0,

    wrapper:
      0,

    persistence:
      0,

    capturedConfirmation:
      null as string | null,

    capturedPrincipal:
      null as any,

    capturedRegistration:
      null as any,

    capturedAction:
      null as string | null,

    capturedPersistenceClient:
      null as any,
  };

  const prisma =
    {
      marker:
        "SYNTHETIC_PRISMA",
    } as any;

  const syntheticStore =
    {
      marker:
        "SYNTHETIC_STORE",
    } as any;

  const post =
    createFrenchWardBuyerTransactionPost({
      getPrincipal:
        (async () =>
          authenticated
            ? principal
            : null) as any,

      prisma,

      resolveFrenchWardActionAuthorityWithClient:
        (async input => {
          calls.authority +=
            1;

          calls.capturedAction =
            input.action;

          assert.equal(
            input.client,
            prisma,
          );

          assert.equal(
            input.userId,
            principal.userId,
          );

          return allowed
            ? {
                allowed:
                  true,

                action:
                  input.action,

                standing:
                  governingStanding,
              }
            : {
                allowed:
                  false,

                action:
                  input.action,

                reason:
                  "NO_GOVERNING_STANDING",

                standing:
                  null,
              };
        }) as any,

      loadNeonObjectStorageConfig:
        (() => {
          calls.storageConfig +=
            1;

          return storageAvailable
            ? storageConfig
            : null;
        }) as any,

      createExternalIntakeConditionalS3Store:
        ((config: any) => {
          calls.storeFactory +=
            1;

          assert.deepEqual(
            config,
            storageConfig,
          );

          return syntheticStore;
        }) as any,

      registerFrenchWardBuyerTransactionWithCustody:
        (async input => {
          calls.wrapper +=
            1;

          calls.capturedConfirmation =
            input.confirmation;

          calls.capturedPrincipal =
            input.principal;

          calls.capturedRegistration =
            input.registration;

          assert.equal(
            input.client,
            prisma,
          );

          assert.equal(
            input.store,
            syntheticStore,
          );

          if (wrapperError) {
            throw new Error(
              wrapperError,
            );
          }

          /*
           * Exercise the adapter's persistence callback without
           * using Prisma. The fake wrapper supplies a sentinel
           * registration object exactly as a domain wrapper would.
           */
          await input.register(
            {
              sentinel:
                "registration-from-wrapper",
            } as any,
          );

          return {
            receipt: {
              intakeId:
                "synthetic-intake-id",

              intakeReference:
                "AXPT-INT-EXT-SYNTHETIC",

              status:
                "SUBMITTED",

              alreadyRegistered,
            },

            custody: {
              reference:
                "private/evidence/synthetic",

              sha256:
                "a".repeat(64),

              byteLength:
                evidenceBytes.byteLength,

              disposition:
                alreadyRegistered
                  ? "exists"
                  : "created",
            },
          };
        }) as any,

      registerExternalIntakeWithClient:
        (async (
          client: any,
          registration: any,
        ) => {
          calls.persistence +=
            1;

          calls.capturedPersistenceClient =
            client;

          assert.equal(
            client,
            prisma,
          );

          assert.equal(
            registration.sentinel,
            "registration-from-wrapper",
          );

          return {
            intakeId:
              "unused",

            intakeReference:
              "unused",

            status:
              "SUBMITTED",

            alreadyRegistered:
              false,

            evidenceSha256:
              "a".repeat(64),
          };
        }) as any,
    });

  return {
    post,
    calls,
    prisma,
  };
}

async function main() {
  /*
   * 1. Anonymous caller dies before authority, storage or wrapper.
   */
  {
    const {
      post,
      calls,
    } = harness({
      authenticated:
        false,
    });

    const response =
      await post(
        requestFrom(
          registrationForm(),
        ),
      );

    assert.equal(
      response.status,
      401,
    );

    assert.deepEqual(
      await json(response),
      {
        ok:
          false,

        error:
          "AUTHENTICATION_REQUIRED",
      },
    );

    assert.equal(
      calls.authority,
      0,
    );

    assert.equal(
      calls.storageConfig,
      0,
    );

    assert.equal(
      calls.wrapper,
      0,
    );

    console.log(
      "PASS: anonymous caller rejected before authority / storage / registration",
    );
  }

  /*
   * 2. Origin mismatch fails before governing authority.
   */
  {
    const {
      post,
      calls,
    } = harness();

    const response =
      await post(
        requestFrom(
          registrationForm(),
          "https://foreign.example.test",
        ),
      );

    assert.equal(
      response.status,
      403,
    );

    const body =
      await json(response);

    assert.equal(
      body.error,
      "REQUEST_ORIGIN_MISMATCH",
    );

    assert.equal(
      calls.authority,
      0,
    );

    assert.equal(
      calls.storageConfig,
      0,
    );

    assert.equal(
      calls.wrapper,
      0,
    );

    console.log(
      "PASS: cross-origin request rejected before authority and evidence processing",
    );
  }

  /*
   * 3. Authenticated non-governing caller dies before storage / wrapper.
   */
  {
    const {
      post,
      calls,
    } = harness({
      allowed:
        false,
    });

    const response =
      await post(
        requestFrom(
          registrationForm(),
        ),
      );

    assert.equal(
      response.status,
      403,
    );

    const body =
      await json(response);

    assert.equal(
      body.error,
      "FW_TXN_GOVERNING_REGISTRATION_AUTHORITY_REQUIRED",
    );

    assert.equal(
      calls.authority,
      1,
    );

    assert.equal(
      calls.capturedAction,
      FRENCH_WARD_ACTION
        .REGISTER_BUYER_TRANSACTION,
    );

    assert.equal(
      calls.storageConfig,
      0,
    );

    assert.equal(
      calls.storeFactory,
      0,
    );

    assert.equal(
      calls.wrapper,
      0,
    );

    console.log(
      "PASS: non-governing caller rejected before private custody",
    );
  }

  /*
   * 4. Valid governing request with no browser confirmation.
   *    The server must inject the exact confirmation.
   */
  {
    const {
      post,
      calls,
      prisma,
    } = harness();

    const response =
      await post(
        requestFrom(
          registrationForm({
            includeConfirmation:
              false,
          }),
        ),
      );

    assert.equal(
      response.status,
      201,
    );

    const body =
      await json(response);

    assert.equal(
      body.ok,
      true,
    );

    assert.deepEqual(
      body.intake,
      {
        id:
          "synthetic-intake-id",

        reference:
          "AXPT-INT-EXT-SYNTHETIC",

        status:
          "SUBMITTED",

        alreadyRegistered:
          false,
      },
    );

    assert.deepEqual(
      body.evidence,
      {
        sha256:
          "a".repeat(64),

        byteLength:
          evidenceBytes.byteLength,

        disposition:
          "created",
      },
    );

    assert.equal(
      body.registrationMode,
      "FRENCH_WARD_GOVERNING_REGISTER",
    );

    assert.equal(
      body.buyerAuthorityVerified,
      false,
    );

    assert.equal(
      body.representativeAuthorityGranted,
      false,
    );

    assert.equal(
      body.opportunityPromoted,
      false,
    );

    assert.equal(
      Object.hasOwn(
        body.evidence,
        "reference",
      ),
      false,
    );

    assert.equal(
      calls.capturedConfirmation,
      FRENCH_WARD_REGISTER_BUYER_TRANSACTION_CONFIRMATION,
    );

    assert.deepEqual(
      calls.capturedPrincipal,
      {
        userId:
          principal.userId,

        email:
          principal.email,
      },
    );

    assert.equal(
      calls.capturedRegistration
        .operationalReference,
      "FW-TXN-HTTP-SYNTHETIC-001",
    );

    assert.equal(
      calls.capturedRegistration
        .buyerName,
      "SYNTHETIC BUYER - NOT LIVE",
    );

    assert.ok(
      calls.capturedRegistration
        .evidenceBytes
        instanceof Uint8Array,
    );

    assert.deepEqual(
      Array.from(
        calls.capturedRegistration
          .evidenceBytes,
      ),
      Array.from(
        evidenceBytes,
      ),
    );

    assert.equal(
      calls.capturedPersistenceClient,
      prisma,
    );

    assert.equal(
      calls.authority,
      1,
    );

    assert.equal(
      calls.storageConfig,
      1,
    );

    assert.equal(
      calls.storeFactory,
      1,
    );

    assert.equal(
      calls.wrapper,
      1,
    );

    assert.equal(
      calls.persistence,
      1,
    );

    console.log(
      "PASS: governing request reaches registration with server-owned authority inputs",
    );

    console.log(
      "PASS: response exposes no private custody reference and grants no commercial authority",
    );
  }

  /*
   * 5. Browser-supplied false confirmation is overwritten.
   */
  {
    const {
      post,
      calls,
    } = harness();

    const response =
      await post(
        requestFrom(
          registrationForm({
            includeConfirmation:
              true,

            confirmation:
              "BROWSER CHOOSES NOTHING",
          }),
        ),
      );

    assert.equal(
      response.status,
      201,
    );

    assert.equal(
      calls.capturedConfirmation,
      FRENCH_WARD_REGISTER_BUYER_TRANSACTION_CONFIRMATION,
    );

    console.log(
      "PASS: browser confirmation cannot alter governing confirmation",
    );
  }

  /*
   * 6. Missing private storage fails closed before wrapper execution.
   */
  {
    const {
      post,
      calls,
    } = harness({
      storageAvailable:
        false,
    });

    const response =
      await post(
        requestFrom(
          registrationForm(),
        ),
      );

    assert.equal(
      response.status,
      503,
    );

    const body =
      await json(response);

    assert.equal(
      body.error,
      "PRIVATE_STORAGE_UNAVAILABLE",
    );

    assert.equal(
      calls.wrapper,
      0,
    );

    assert.equal(
      calls.persistence,
      0,
    );

    console.log(
      "PASS: absent private custody fails closed before registration",
    );
  }

  /*
   * 7. Idempotent domain replay returns 200.
   */
  {
    const {
      post,
    } = harness({
      alreadyRegistered:
        true,
    });

    const response =
      await post(
        requestFrom(
          registrationForm(),
        ),
      );

    assert.equal(
      response.status,
      200,
    );

    const body =
      await json(response);

    assert.equal(
      body.intake
        .alreadyRegistered,
      true,
    );

    assert.equal(
      body.evidence
        .disposition,
      "exists",
    );

    console.log(
      "PASS: domain replay maps to 200 without new-registration semantics",
    );
  }

  /*
   * 8. Domain registration conflict maps to 409.
   */
  {
    const {
      post,
    } = harness({
      wrapperError:
        "FW_TXN_REGISTRATION_CONFLICT",
    });

    const response =
      await post(
        requestFrom(
          registrationForm(),
        ),
      );

    assert.equal(
      response.status,
      409,
    );

    const body =
      await json(response);

    assert.equal(
      body.error,
      "REGISTRATION_CONFLICT",
    );

    console.log(
      "PASS: conflicting registration maps to 409",
    );
  }

  /*
   * 9. Custody failure maps to 503.
   */
  {
    const {
      post,
    } = harness({
      wrapperError:
        "FW_TXN_CUSTODY_READBACK_MISMATCH",
    });

    const response =
      await post(
        requestFrom(
          registrationForm(),
        ),
      );

    assert.equal(
      response.status,
      503,
    );

    const body =
      await json(response);

    assert.equal(
      body.error,
      "EVIDENCE_CUSTODY_UNAVAILABLE",
    );

    console.log(
      "PASS: custody failure maps to 503",
    );
  }

  console.log(
    "FW-ACTIONS-2D.1C PASS · deterministic governing HTTP boundary",
  );

  console.log(
    "No PostgreSQL connection · no object storage · no runtime mutation",
  );
}

main().catch(error => {
  console.error(
    "FAIL:",
    error,
  );

  process.exitCode =
    1;
});
