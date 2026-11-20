import assert from "node:assert/strict";

import { hashInstrumentAccessToken } from "../../src/domains/instruments/access/accessToken";
import {
  issueInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantIssuanceClient,
} from "../../src/domains/instruments/commands/issueInstrumentAccessGrantWithClient";
import {
  revokeInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantRevocationClient,
} from "../../src/domains/instruments/commands/revokeInstrumentAccessGrantWithClient";

async function main() {
  let storedCodeHash: string | null = null;
  let storedInstrumentVersionId: string | null | undefined = undefined;
  let revokedAt: Date | null = null;
  const events: Array<{
    eventType: string;
    payload?: Record<string, unknown>;
  }> = [];

  const client = {
    institutionalInstrument: {
      findUnique: async () => ({
        id: "instrument-1",
        reference: "FW-DSI-2026-001",
      }),
    },

    instrumentVersion: {
      findUnique: async ({
        where,
      }: {
        where: {
          instrumentId_number: {
            instrumentId: string;
            number: number;
          };
        };
      }) => {
        if (
          where.instrumentId_number.instrumentId === "instrument-1" &&
          where.instrumentId_number.number === 2
        ) {
          return {
            id: "version-2",
            number: 2,
            status: "ISSUED",
          };
        }

        return null;
      },
    },

    instrumentAccessGrant: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        storedCodeHash = data.codeHash as string;
        storedInstrumentVersionId =
          (data.instrumentVersionId as string | null) ?? null;

        return {
          id: "grant-1",
          instrumentVersionId: storedInstrumentVersionId,
          recipientName: data.recipientName,
          accessLevel: data.accessLevel,
          expiresAt: data.expiresAt,
        };
      },

      findUnique: async () => ({
        id: "grant-1",
        instrumentId: "instrument-1",
        revokedAt,
      }),

      updateMany: async ({ data }: { data: { revokedAt: Date } }) => {
        revokedAt = data.revokedAt;
        return { count: 1 };
      },
    },

    domainEvent: {
      create: async ({
        data,
      }: {
        data: {
          eventType: string;
          payload?: Record<string, unknown>;
        };
      }) => {
        events.push({
          eventType: data.eventType,
          payload: data.payload,
        });

        return {};
      },
    },
  } as unknown as InstrumentAccessGrantIssuanceClient &
    InstrumentAccessGrantRevocationClient;

  const issued = await issueInstrumentAccessGrantWithClient({
    client,
    instrumentReference: "FW-DSI-2026-001",
    instrumentVersionNumber: 2,
    recipientName: "Authorized Counterparty",
    issuedByUserId: "operator-1",
    expiresAt: new Date(Date.now() + 60_000),
  });

  assert.equal(issued.token.length >= 40, true);
  assert.equal(storedCodeHash, hashInstrumentAccessToken(issued.token));
  assert.equal(storedInstrumentVersionId, "version-2");
  assert.equal(issued.instrumentVersion?.number, 2);

  assert.equal(events[0]?.eventType, "INSTRUMENT_ACCESS_GRANTED");
  assert.equal(events[0]?.payload?.instrumentVersionId, "version-2");
  assert.equal(events[0]?.payload?.instrumentVersionNumber, 2);

  const revoked = await revokeInstrumentAccessGrantWithClient({
    client,
    accessGrantId: "grant-1",
    revokedByUserId: "operator-1",
  });

  assert.equal(revoked.revoked, true);
  assert.ok(revokedAt);
  assert.equal(events[1]?.eventType, "INSTRUMENT_ACCESS_REVOKED");

  console.log("INSTRUMENT_ACCESS_GRANT_VERSION_BOUND_OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
