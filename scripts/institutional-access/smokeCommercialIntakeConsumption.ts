import assert from "node:assert/strict";

import {
  consumeInstitutionalAccessWithClient,
  InstitutionalAccessDeniedError,
} from "../../src/domains/institutional-access/consumeInstitutionalAccessWithClient";

async function main() {
  let allowAccess =
    true;

  let executeCount =
    0;

  let eventCount =
    0;

  let grantUpdateCount =
    0;

  let grantFirstAccessCount =
    0;

  let lockCount =
    0;

  const tx = {
    $queryRaw:
      async () => {
        lockCount++;
        return [];
      },

    institutionalAccessGrant: {
      findFirst:
        async ({
          where,
        }: any) => {
          assert.equal(
            where.recipientUserId,
            "visitor-1",
          );

          assert.equal(
            where.recipientEmail,
            "visitor@example.com",
          );

          assert.equal(
            where.scope,
            "LOI_INTAKE_ACCESS",
          );

          assert.equal(
            where.resourceReference,
            "french-ward:commercial-intake:v1",
          );

          assert.equal(
            where.resourceVersion,
            1,
          );

          assert.equal(
            where.revokedAt,
            null,
          );

          assert.equal(
            where.request.status,
            "APPROVED",
          );

          if (
            !allowAccess
          ) {
            return null;
          }

          return {
            id:
              "grant-1",

            requestId:
              "request-1",

            recipientUserId:
              "visitor-1",

            scope:
              "LOI_INTAKE_ACCESS",

            resourceReference:
              "french-ward:commercial-intake:v1",

            resourceVersion:
              1,

            expiresAt:
              new Date(
                Date.now() +
                  60_000,
              ),
          };
        },

      update:
        async ({
          where,
          data,
        }: any) => {
          assert.equal(
            where.id,
            "grant-1",
          );

          assert.ok(
            data.lastAccessAt instanceof
              Date,
          );

          grantUpdateCount++;

          return {
            id:
              "grant-1",
          };
        },

      updateMany:
        async ({
          where,
          data,
        }: any) => {
          assert.equal(
            where.id,
            "grant-1",
          );

          assert.equal(
            where.firstAccessAt,
            null,
          );

          assert.ok(
            data.firstAccessAt instanceof
              Date,
          );

          grantFirstAccessCount++;

          return {
            count:
              1,
          };
        },
    },

    institutionalAccessEvent: {
      create:
        async ({
          data,
        }: any) => {
          assert.equal(
            data.requestId,
            "request-1",
          );

          assert.equal(
            data.grantId,
            "grant-1",
          );

          assert.equal(
            data.type,
            "INTAKE_SUBMITTED",
          );

          assert.equal(
            data.actorUserId,
            "visitor-1",
          );

          assert.equal(
            data.metadata.action,
            "SUBMIT_INTAKE",
          );

          assert.equal(
            data.metadata.resourceReference,
            "french-ward:commercial-intake:v1",
          );

          assert.equal(
            data.metadata.resourceVersion,
            1,
          );

          assert.equal(
            data.metadata.intakeId,
            "intake-1",
          );

          assert.equal(
            data.metadata.intakeReference,
            "FW-INTAKE-TEST-001",
          );

          eventCount++;

          return {
            id:
              "event-1",
          };
        },
    },

    transactionIntake: {
      create:
        async () => {
          throw new Error(
            "transactionIntake.create should be controlled by execute callback in this smoke",
          );
        },
    },
  };

  const client = {
    $transaction:
      async (
        callback:
          (transaction: any) =>
            Promise<any>,
      ) =>
        callback(
          tx,
        ),
  };

  const value =
    await consumeInstitutionalAccessWithClient(
      {
        client:
          client as never,

        identity: {
          userId:
            "visitor-1",

          email:
            " Visitor@Example.com ",
        },

        scope:
          "LOI_INTAKE_ACCESS",

        action:
          "SUBMIT_INTAKE",

        resourceReference:
          "french-ward:commercial-intake:v1",

        resourceVersion:
          1,

        execute:
          async () => {
            executeCount++;

            return {
              value: {
                ok:
                  true,
              },

              intakeId:
                "intake-1",

              intakeReference:
                "FW-INTAKE-TEST-001",
            };
          },
      },
    );

  assert.deepEqual(
    value,
    {
      ok:
        true,
    },
  );

  assert.equal(
    executeCount,
    1,
  );

  assert.equal(
    lockCount,
    1,
  );

  assert.equal(
    grantUpdateCount,
    1,
  );

  assert.equal(
    grantFirstAccessCount,
    1,
  );

  assert.equal(
    eventCount,
    1,
  );

  /*
   * Denied access must stop before mutation/audit.
   */
  allowAccess =
    false;

  const executeBefore =
    executeCount;

  const eventsBefore =
    eventCount;

  await assert.rejects(
    consumeInstitutionalAccessWithClient(
      {
        client:
          client as never,

        identity: {
          userId:
            "visitor-1",

          email:
            "visitor@example.com",
        },

        scope:
          "LOI_INTAKE_ACCESS",

        action:
          "SUBMIT_INTAKE",

        resourceReference:
          "french-ward:commercial-intake:v1",

        resourceVersion:
          1,

        execute:
          async () => {
            executeCount++;

            return {
              value: {
                ok:
                  true,
              },

              intakeId:
                "should-not-exist",

              intakeReference:
                "should-not-exist",
            };
          },
      },
    ),
    InstitutionalAccessDeniedError,
  );

  assert.equal(
    executeCount,
    executeBefore,
  );

  assert.equal(
    eventCount,
    eventsBefore,
  );

  console.log(
    "PASS: intake consumption re-resolves grant under recipient lock, audits successful submission, and denies mutation without access.",
  );
}

main();
