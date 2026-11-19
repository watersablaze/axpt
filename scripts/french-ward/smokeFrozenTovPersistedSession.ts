/**
 * FW-CD-1A.3 · Canonical signed + persisted session rehearsal.
 *
 * Verifies existing verifySignedPersistedSession with ephemeral HS256 test keys,
 * in-memory persisted session records and the actual frozen-PDF response mapping.
 * Does NOT create AXPT sessions, email codes, cookies, DB records or an HTTP bypass.
 * This is a bounded composition check, not a test of getPrincipal's DB lookup.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { SignJWT } from "jose";

import { verifySignedPersistedSession } from "@/lib/auth/verifySignedPersistedSession";
import type { PersistedSessionRecord } from "@/lib/auth/sessionRecordPolicy";
import { resolveAuthorizedFrozenTovPdf } from "@/domains/institutions/french-ward/documents/resolveAuthorizedFrozenTovPdf";
import { respondWithFrozenTovPdf } from "@/domains/institutions/french-ward/documents/respondWithFrozenTovPdf";
import { FW_TOV_R04_PDF } from "@/domains/institutions/french-ward/documents/tovFrozenPdfDescriptor";

async function main() {
  const pdfPath = process.argv[2];
  assert.ok(pdfPath, "Pass the accepted PDF path");
  const bytes = new Uint8Array(await readFile(pdfPath));
  assert.equal(bytes.byteLength, FW_TOV_R04_PDF.byteLength);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), FW_TOV_R04_PDF.sha256);

  const secret = new TextEncoder().encode("FW-CD-1A.3-only-ephemeral-fixture-key-not-for-runtime");
  const wrongSecret = new TextEncoder().encode("another-ephemeral-fixture-key-never-for-runtime-01");
  const now = new Date();
  const unix = Math.floor(now.getTime() / 1000);
  const userId = "synthetic-fw-admin";
  const tokenId = "fixture-session-1";
  const publication = {
    reference: FW_TOV_R04_PDF.reference,
    version: FW_TOV_R04_PDF.edition,
    publicationRevision: FW_TOV_R04_PDF.publicationRevision,
    publicationHash: FW_TOV_R04_PDF.publicationHash,
  };
  const record: PersistedSessionRecord = {
    userId,
    status: "active",
    expiresAt: new Date(now.getTime() + 3600_000),
    invalidatedAt: null,
    endedAt: null,
  };

  async function sign(input: {
    secret?: Uint8Array;
    tokenId?: string;
    userId?: string;
    expiry?: number;
    claimedRoles?: string[];
  } = {}) {
    return new SignJWT({
      userId: input.userId ?? userId,
      tokenId: input.tokenId ?? tokenId,
      email: "synthetic@example.invalid",
      tier: "resident",
      displayName: "Synthetic Admin",
      roles: input.claimedRoles ?? ["ADMIN_PLATFORM"],
      docs: [],
      partner: "AXPT",
      popupMessage: "fixture",
      greeting: "fixture",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(unix)
      .setExpirationTime(input.expiry ?? unix + 1800)
      .sign(input.secret ?? secret);
  }

  const validToken = await sign();

  async function request(args: {
    token: string | null;
    persisted?: PersistedSessionRecord | null;
    persistedRoles?: string[];
  }): Promise<{ response: Response; reads: number; lookups: number }> {
    let lookups = 0;
    const session = args.token
      ? await verifySignedPersistedSession(args.token, secret, async (id) => {
          lookups++;
          assert.equal(id, tokenId);
          return args.persisted === undefined ? record : args.persisted;
        }, now)
      : null;

    // Emulates the DB role projection made by getPrincipal after session
    // validation. It never trusts a token's self-asserted roles.
    const actor = session
      ? { roles: args.persistedRoles ?? ["ADMIN_PLATFORM"], permissions: [] as string[] }
      : null;
    let reads = 0;
    const response = await respondWithFrozenTovPdf(() =>
      resolveAuthorizedFrozenTovPdf({
        actor,
        publication,
        reader: {
          read: async (key) => {
            reads++;
            assert.equal(key, FW_TOV_R04_PDF.storageKey);
            return bytes;
          },
        },
      }),
    );
    return { response, reads, lookups };
  }

  const authorized = await request({ token: validToken });
  assert.equal(authorized.response.status, 200);
  assert.equal(authorized.reads, 1);
  assert.equal(authorized.lookups, 1);
  assert.equal(createHash("sha256").update(new Uint8Array(await authorized.response.arrayBuffer())).digest("hex"), FW_TOV_R04_PDF.sha256);
  console.log("PASS persisted signed admin fixture -> HTTP 200 exact PDF");

  const unauthenticated = await request({ token: null });
  assert.equal(unauthenticated.response.status, 404);
  assert.equal(unauthenticated.lookups, 0);
  assert.equal(unauthenticated.reads, 0);
  console.log("PASS no token -> 404, no session lookup or object read");

  const deniedFixtures: Array<{ label: string; token: string; persisted?: PersistedSessionRecord | null; roles?: string[] }> = [
    { label: "unknown persisted session", token: validToken, persisted: null },
    { label: "revoked session", token: validToken, persisted: { ...record, invalidatedAt: now } },
    { label: "ended session", token: validToken, persisted: { ...record, endedAt: now } },
    { label: "inactive session", token: validToken, persisted: { ...record, status: "revoked" } },
    { label: "expired persisted session", token: validToken, persisted: { ...record, expiresAt: new Date(now.getTime() - 1000) } },
    { label: "user mismatch", token: validToken, persisted: { ...record, userId: "different-user" } },
    { label: "bad JWT signature", token: await sign({ secret: wrongSecret }) },
    { label: "expired JWT", token: await sign({ expiry: unix - 120 }) },
    { label: "token without persisted key", token: await sign({ tokenId: "" }) },
    { label: "token admin role with nonadmin DB role", token: validToken, roles: ["REPRESENTATIVE"] },
  ];

  for (const fixture of deniedFixtures) {
    const result = await request({
      token: fixture.token,
      persisted: fixture.persisted,
      persistedRoles: fixture.roles,
    });
    assert.equal(result.response.status, 404, fixture.label);
    assert.equal(result.reads, 0, fixture.label);
    assert.equal(result.response.headers.get("Content-Disposition"), null);
    assert.equal(await result.response.text(), "Not found");
    console.log(`PASS ${fixture.label} -> 404 before object read`);
  }
  console.log("FW-CD-1A.3 SIGNED PERSISTED SESSION COMPOSITION PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
