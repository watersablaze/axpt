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
  let revokedAt: Date | null = null;
  const events: string[] = [];

  const client = {
    institutionalInstrument: {
      findUnique: async () => ({
        id: "instrument-1",
        reference: "FW-DSI-2026-001",
      }),
    },
    instrumentAccessGrant: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        storedCodeHash = data.codeHash as string;
        return {
          id: "grant-1",
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
      create: async ({ data }: { data: { eventType: string } }) => {
        events.push(data.eventType);
        return {};
      },
    },
  } as unknown as InstrumentAccessGrantIssuanceClient &
    InstrumentAccessGrantRevocationClient;

  const issued = await issueInstrumentAccessGrantWithClient({
    client,
    instrumentReference: "FW-DSI-2026-001",
    recipientName: "Authorized Counterparty",
    issuedByUserId: "operator-1",
    expiresAt: new Date(Date.now() + 60_000),
  });

  assert.equal(issued.token.length >= 40, true);
  assert.equal(storedCodeHash, hashInstrumentAccessToken(issued.token));
  assert.equal(events[0], "INSTRUMENT_ACCESS_GRANTED");

  const revoked = await revokeInstrumentAccessGrantWithClient({
    client,
    accessGrantId: "grant-1",
    revokedByUserId: "operator-1",
  });

  assert.equal(revoked.revoked, true);
  assert.ok(revokedAt);
  assert.equal(events[1], "INSTRUMENT_ACCESS_REVOKED");

  console.log("INSTRUMENT_ACCESS_GRANT_OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
