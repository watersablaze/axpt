import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const base = "../../src/domains/instruments/representative-program/commercial-utility-pack/";
const { createAgreementByteReader } = require(base + "supporting-documents/readCachedAgreementBytes.ts");
const { createSupportingDocumentByteCache } = require(base + "supporting-documents/supportingDocumentByteCache.ts");
const { loadRepresentativeCommercialUtilityPackAgreementWithClient: load } = require(base + "application/loadRepresentativeCommercialUtilityPackAgreementWithClient.ts");
const bytes = new Uint8Array(Buffer.from("%PDF-1.7\nfixture signed agreement"));
const hash = createHash("sha256").update(bytes).digest("hex");
const env = { AWS_ENDPOINT_URL_S3: "https://storage.example.invalid", AWS_REGION: "test", AWS_ACCESS_KEY_ID: "key", AWS_SECRET_ACCESS_KEY: "secret", AXPT_TRANSACTION_DOCUMENT_BUCKET: "fixture", BLOB_READ_WRITE_TOKEN: "blob-token" };
let now = 0, reads = 0;
const readVerifiedBytes = createAgreementByteReader({ environment: () => env,
 cache: createSupportingDocumentByteCache({ maximumBytes: 1000, maximumEntries: 2, ttlMs: 60000, now: () => now }) });
const uri = "s3://fixture/execution.pdf";
const read = async () => { reads++; return bytes.slice(); };
const request = { uri, sha256: hash, read };
assert.deepEqual(await readVerifiedBytes(request), bytes);
const copy = await readVerifiedBytes(request); copy[0] = 0;
assert.deepEqual(await readVerifiedBytes(request), bytes); assert.equal(reads, 1);
delete env.AWS_SECRET_ACCESS_KEY;
await assert.rejects(readVerifiedBytes(request), /STORAGE_UNAVAILABLE/);
env.AWS_SECRET_ACCESS_KEY = "rotated";
await readVerifiedBytes(request); assert.equal(reads, 2);
env.AWS_SECRET_ACCESS_KEY = "rotated-again";
await readVerifiedBytes(request); assert.equal(reads, 3);
now = 60001; await readVerifiedBytes(request); assert.equal(reads, 4);
await assert.rejects(readVerifiedBytes({ ...request, uri: "s3://fixture/corrupt.pdf", read: async () => Buffer.from("%PDF-corrupt") }), /INTEGRITY_FAILED/);
const before = reads; await readVerifiedBytes({ ...request, uri: "s3://fixture/corrupt.pdf" }); assert.equal(reads, before + 1);
await assert.rejects(readVerifiedBytes({ ...request, uri: "s3://fixture/changing.pdf", read: async () => { env.AWS_SECRET_ACCESS_KEY = "changed-during-read"; return bytes; } }), /STORAGE_CHANGED/);
const input = { client: null, userId: "user", resourceReleaseId: "release", bucket: "fixture", read, readVerifiedBytes };
let viewable = true, status = "EXECUTED", confirmed = true, databaseReads = 0;
input.client = {
 representativeProgramParticipant: { findMany: async args => {
  databaseReads++;
  if (!args.select.onboardingIntake) return [{ id: "participant" }];
  return [{ id: "participant", onboardingIntake: { status: "ADMITTED", admittedParticipantId: "participant", masterAgreementInstrumentId: "agreement", masterAgreementInstrument: { id: "agreement", reference: "AGREEMENT", kind: "REPRESENTATIVE_PROGRAM_AGREEMENT", status, evidence: [{ evidenceType: "DOCUMENT", subjectType: "EXECUTION", uri, contentHash: hash, metadata: { operatorConfirmedAllSignatures: confirmed } }] } } }];
 } },
 commercialUtilityPack: { findUnique: async () => {
  databaseReads++;
  return { participantId: "participant", reference: "CUP", version: 1, audience: "REPRESENTATIVE", state: "CURRENT", releaseState: "RELEASED", modules: ["REPRESENTATION", "COMMERCIAL_PARAMETERS", "DOCUMENTS", "OPERATING_BOUNDARIES"].map(module => ({ module, state: "RELEASED" })), resources: [{ id: "release", module: "DOCUMENTS", resourceType: "INSTITUTIONAL_INSTRUMENT", resourceId: "agreement", label: "Agreement", state: "RELEASED", canView: viewable, canDownload: false, canPresent: false, canTransmit: false }] };
 } },
};
assert.ok(await load(input)); const firstReads = reads, firstDatabaseReads = databaseReads;
assert.ok(await load(input)); assert.equal(reads, firstReads); assert.ok(databaseReads > firstDatabaseReads);
viewable = false; assert.equal(await load(input), null); viewable = true;
status = "DRAFT"; assert.equal(await load(input), null); status = "EXECUTED";
confirmed = false; assert.equal(await load(input), null); confirmed = true;
assert.equal(reads, firstReads);
const result = await load(input); assert.equal(result.canDownload, false);
console.log("AGREEMENT_BYTE_CACHE_OK: verified reuse, fresh canonical reads, withdrawn view/execution/signatures denied, download flag preserved, credential loss/rotation/in-flight change, corrupt exclusion, TTL and defensive copies.");
