import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveInstitutionalAccessWithClient,
} from "../../src/domains/institutional-access/resolveInstitutionalAccessWithClient";

/*
 * Explicitly designated synthetic recipient for the local contract smoke.
 * Acceptance-environment verification must use a separately designated
 * real test recipient and must not use Jens.
 */
const TEST_RECIPIENT = {
  userId:
    "loi-acceptance-recipient",

  email:
    "loi-acceptance-recipient@example.test",
};

const RESOURCE_REFERENCE =
  "french-ward:commercial-intake:v1";

const RESOURCE_VERSION =
  1;

type GrantState =
  | "ACTIVE"
  | "ABSENT"
  | "EXPIRED"
  | "REVOKED";

async function resolve(
  state:
    GrantState,
) {
  let queryCount =
    0;

  const client = {
    institutionalAccessGrant: {
      findFirst:
        async ({
          where,
        }: any) => {
          queryCount++;

          assert.equal(
            where.recipientUserId,
            TEST_RECIPIENT.userId,
          );

          assert.equal(
            where.recipientEmail,
            TEST_RECIPIENT.email,
          );

          assert.equal(
            where.scope,
            "LOI_INTAKE_ACCESS",
          );

          assert.equal(
            where.resourceReference,
            RESOURCE_REFERENCE,
          );

          assert.equal(
            where.resourceVersion,
            RESOURCE_VERSION,
          );

          assert.equal(
            where.revokedAt,
            null,
          );

          assert.equal(
            where.request.status,
            "APPROVED",
          );

          assert.equal(
            where.request.requesterEmail,
            TEST_RECIPIENT.email,
          );

          assert.ok(
            where.expiresAt.gt instanceof
              Date,
          );

          if (
            state ===
              "ABSENT" ||
            state ===
              "EXPIRED" ||
            state ===
              "REVOKED"
          ) {
            /*
             * Prisma would exclude these states under the resolver's
             * where-clause. The fake returns null to model that result.
             */
            return null;
          }

          return {
            id:
              "grant-active",

            requestId:
              "request-active",

            recipientUserId:
              TEST_RECIPIENT.userId,

            scope:
              "LOI_INTAKE_ACCESS",

            resourceReference:
              RESOURCE_REFERENCE,

            resourceVersion:
              RESOURCE_VERSION,

            expiresAt:
              new Date(
                Date.now() +
                  86_400_000,
              ),
          };
        },
    },
  };

  const access =
    await resolveInstitutionalAccessWithClient({
      client:
        client as never,

      identity: {
        userId:
          TEST_RECIPIENT.userId,

        email:
          TEST_RECIPIENT.email,
      },

      scope:
        "LOI_INTAKE_ACCESS",

      action:
        "VIEW_FORM",

      resourceReference:
        RESOURCE_REFERENCE,

      resourceVersion:
        RESOURCE_VERSION,
    });

  assert.equal(
    queryCount,
    1,
  );

  return access;
}

async function main() {
  const active =
    await resolve(
      "ACTIVE",
    );

  assert.equal(
    active.allowed,
    true,
  );

  for (
    const state of [
      "ABSENT",
      "EXPIRED",
      "REVOKED",
    ] as const
  ) {
    const access =
      await resolve(
        state,
      );

    assert.equal(
      access.allowed,
      false,
      `${state} grant must not permit VIEW_FORM`,
    );
  }

  const loginPage =
    fs.readFileSync(
      "app/(auth)/login/page.tsx",
      "utf8",
    );

  const accessSurface =
    fs.readFileSync(
      "app/transaction-intake/CommercialIntakeAccessRequest.tsx",
      "utf8",
    );

  const intakePage =
    fs.readFileSync(
      "app/transaction-intake/page.tsx",
      "utf8",
    );

  assert.match(
    loginPage,
    /'\/french-ward\/transaction-intake'/,
  );

  assert.match(
    accessSurface,
    /\/login\?next=%2Ffrench-ward%2Ftransaction-intake/,
  );

  assert.match(
    intakePage,
    /action:\s*"VIEW_FORM"/,
  );

  /*
   * Viewing is read-only. Submission consumption and notification
   * behavior must remain exclusively in the POST endpoint.
   */
  assert.doesNotMatch(
    intakePage,
    /consumeInstitutionalAccessWithClient/,
  );

  assert.doesNotMatch(
    intakePage,
    /sendTransactionIntakeConfirmation/,
  );

  assert.doesNotMatch(
    intakePage,
    /sendTransactionIntakeInternalNotification/,
  );

  console.log(
    "PASS: approved recipient has a canonical sign-in return path; absent, expired, and revoked grants deny form viewing; VIEW_FORM has no submission side effects.",
  );
}

main();
