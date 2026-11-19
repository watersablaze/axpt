/**
 * FW-CD-1A.1 · Non-email frozen-PDF rehearsal.
 *
 * Usage:
 *   pnpm exec tsx scripts/french-ward/smokeFrozenTovPdf.ts \
 *     "$HOME/Downloads/FW-TOV-2026-001-Edition01-R04-Desktop-Compatible-Review.pdf"
 *
 * Pure fixture test: no HTTP server, email, DB, storage credentials, uploads,
 * authentication cookies, or production permissions.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { FW_TOV_R04_PDF } from "@/domains/institutions/french-ward/documents/tovFrozenPdfDescriptor";
import { resolveAuthorizedFrozenTovPdf } from "@/domains/institutions/french-ward/documents/resolveAuthorizedFrozenTovPdf";
import { GsamArtifactVerificationError } from "@/domains/instruments/transaction-documents/gsamVerifiedArtifact";

async function main() {
const path = process.argv[2];
if (!path) throw new Error("Pass the local accepted TOV PDF file path as the single argument");

const bytes = new Uint8Array(await readFile(path));
assert.equal(bytes.byteLength, FW_TOV_R04_PDF.byteLength, "Fixture byte count");
assert.equal(
  createHash("sha256").update(bytes).digest("hex"),
  FW_TOV_R04_PDF.sha256,
  "Accepted PDF fixture SHA-256",
);

const publication = {
  reference: FW_TOV_R04_PDF.reference,
  version: FW_TOV_R04_PDF.edition,
  publicationRevision: FW_TOV_R04_PDF.publicationRevision,
  publicationHash: FW_TOV_R04_PDF.publicationHash,
};
const admin = { roles: ["ADMIN_PLATFORM"], permissions: [] as string[] };
const reader = { read: async (key: string) => {
  assert.equal(key, FW_TOV_R04_PDF.storageKey);
  return bytes;
} };

const granted = await resolveAuthorizedFrozenTovPdf({
  actor: admin,
  publication,
  reader,
});
assert.ok(granted);
assert.equal(granted.sha256, FW_TOV_R04_PDF.sha256);
assert.equal(granted.filename, FW_TOV_R04_PDF.downloadName);
assert.deepEqual(granted.bytes, bytes);
console.log("PASS admin accepted PDF: exact registered bytes");

for (const actor of [null, { roles: [], permissions: [] }, { roles: ["REPRESENTATIVE"], permissions: [] }]) {
  let reads = 0;
  const denied = await resolveAuthorizedFrozenTovPdf({
    actor,
    publication,
    reader: { read: async () => { reads++; return bytes; } },
  });
  assert.equal(denied, null);
  assert.equal(reads, 0, "Unauthorized must not read storage");
}
console.log("PASS missing principal and non-admin denied before storage read");

await assert.rejects(
  resolveAuthorizedFrozenTovPdf({
    actor: admin,
    publication: { ...publication, publicationHash: "0".repeat(64) },
    reader,
  }),
  /FW_TOV_PUBLICATION_IDENTITY_MISMATCH/,
);
console.log("PASS altered publication identity denied");

await assert.rejects(
  resolveAuthorizedFrozenTovPdf({ actor: admin, publication, reader: null }),
  /FW_TOV_STORAGE_UNAVAILABLE/,
);
console.log("PASS absent storage fails closed");

await assert.rejects(
  resolveAuthorizedFrozenTovPdf({
    actor: admin,
    publication,
    reader: { read: async () => { throw new Error("Object missing"); } },
  }),
  (error: unknown) => error instanceof GsamArtifactVerificationError && error.reason === "READ_FAILED",
);
console.log("PASS missing object fails closed");

const altered = new Uint8Array(bytes);
altered[altered.length - 1] ^= 1;
await assert.rejects(
  resolveAuthorizedFrozenTovPdf({
    actor: admin,
    publication,
    reader: { read: async () => altered },
  }),
  (error: unknown) => error instanceof GsamArtifactVerificationError && error.reason === "HASH_MISMATCH",
);
console.log("PASS altered PDF bytes denied");

console.log("FW-CD-1A.1 NON-EMAIL REHEARSAL PASS");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
