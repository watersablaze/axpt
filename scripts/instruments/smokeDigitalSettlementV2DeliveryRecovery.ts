import assert from "node:assert/strict";

import {
  recoverDigitalSettlementV2DeliveryGrantWithClient,
  type DigitalSettlementV2DeliveryRecoveryClient,
} from "../../src/domains/instruments/commands/recoverDigitalSettlementV2DeliveryGrantWithClient";

async function main() {
  let oldRevokedAt: Date | null = null;
  let replacementCreated = 0;

  const events: string[] = [];

  const client = {
    institutionalInstrument: {
      findUnique: async () => ({
        id: "instrument-1",
        status: "ISSUED",
        currentVersion: 2,
        reference: "FW-DSI-2026-001",
      }),
    },

    instrumentVersion: {
      findUnique: async () => ({
        id: "version-2",
        number: 2,
        status: "ISSUED",
      }),
    },

    instrumentAccessGrant: {
      findMany: async () => [
        {
          id: "grant-old",
          instrumentVersionId: "version-2",
          recipientName: "Carl Albert Meisterlin",
          accessLevel: "VIEW",
          expiresAt: new Date(Date.now() + 60_000),
        },
      ],

      findUnique: async ({
        where,
      }: {
        where: { id: string };
      }) => ({
        id: where.id,
        instrumentId: "instrument-1",
        revokedAt: oldRevokedAt,
      }),

      updateMany: async ({
        data,
      }: {
        data: { revokedAt: Date };
      }) => {
        oldRevokedAt = data.revokedAt;

        return {
          count: 1,
        };
      },

      create: async ({
        data,
      }: {
        data: Record<string, unknown>;
      }) => {
        replacementCreated += 1;

        return {
          id: "grant-replacement",
          instrumentVersionId:
            data.instrumentVersionId as string,
          recipientName:
            data.recipientName as string,
          accessLevel:
            data.accessLevel as string,
          expiresAt:
            data.expiresAt as Date,
        };
      },
    },

    emailLog: {
      findFirst: async () => null,
    },

    domainEvent: {
      create: async ({
        data,
      }: {
        data: {
          eventType: string;
        };
      }) => {
        events.push(data.eventType);

        return {};
      },
    },
  } as unknown as DigitalSettlementV2DeliveryRecoveryClient;

  const recovered =
    await recoverDigitalSettlementV2DeliveryGrantWithClient({
      client,
      instrumentReference:
        "FW-DSI-2026-001",
      recipientKey:
        "financier",
      actorUserId:
        "operator-1",
      accessExpiresAt:
        new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000,
        ),
    });

  assert.equal(
    recovered.replacedGrantId,
    "grant-old",
  );

  assert.equal(
    recovered.grant.id,
    "grant-replacement",
  );

  assert.equal(
    recovered.grant.instrumentVersionId,
    "version-2",
  );

  assert.equal(
    recovered.instrumentVersion.number,
    2,
  );

  assert.equal(
    replacementCreated,
    1,
  );

  assert.ok(
    oldRevokedAt,
  );

  assert.deepEqual(
    events,
    [
      "INSTRUMENT_ACCESS_REVOKED",
      "INSTRUMENT_ACCESS_GRANTED",
    ],
  );

  const deliveredClient = {
    ...client,

    instrumentAccessGrant: {
      ...client.instrumentAccessGrant,

      findMany: async () => [
        {
          id: "grant-delivered",
          instrumentVersionId: "version-2",
          recipientName: "Carl Albert Meisterlin",
          accessLevel: "VIEW",
          expiresAt:
            new Date(Date.now() + 60_000),
        },
      ],
    },

    emailLog: {
      findFirst: async () => ({
        id: 1,
        messageId: "resend-message-1",
        createdAt: new Date(),
      }),
    },
  } as unknown as DigitalSettlementV2DeliveryRecoveryClient;

  await assert.rejects(
    () =>
      recoverDigitalSettlementV2DeliveryGrantWithClient({
        client: deliveredClient,
        instrumentReference:
          "FW-DSI-2026-001",
        recipientKey:
          "financier",
        actorUserId:
          "operator-1",
        accessExpiresAt:
          new Date(
            Date.now() +
              7 * 24 * 60 * 60 * 1000,
          ),
      }),
    /DSI_V2_RECOVERY_DELIVERY_ALREADY_SUCCESSFUL/,
  );

  console.log(
    "DSI_V2_RECOVERY_REVOKES_UNDELIVERED_GRANT_OK",
  );

  console.log(
    "DSI_V2_RECOVERY_ISSUES_ONE_VERSION_BOUND_REPLACEMENT_OK",
  );

  console.log(
    "DSI_V2_RECOVERY_REFUSES_SUCCESSFULLY_DELIVERED_GRANT_OK",
  );

  console.log(
    "DSI_V2_RECOVERY_NO_EXTERNAL_DELIVERY_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
