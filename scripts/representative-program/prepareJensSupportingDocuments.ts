import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { head, put } from "@vercel/blob";
import { SUPPORTING_DOCUMENTS } from "../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/catalog";
import { verifySupportingDocumentBytes } from "../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/verifySupportingDocumentBytes";
import { readPrivateSupportingBlob } from "../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/readPrivateSupportingBlob";

const participantId = "cmutqhfec0001l704h0fc4huy";
const packageId = "cmuzudtxf00014y0cwb0zwrj1";
const operatorId = "cmnvt0mri0000w02q1lbj123g";
const hostname = "zjlswvetvtzvn453.private.blob.vercel-storage.com";
const folder = process.argv[2];
const apply = process.argv.includes("--apply");
assert.ok(folder && !folder.startsWith("--"), "STOP: supply the folder containing the three original PDFs");
assert.ok(process.argv.slice(3).every(arg => arg === "--apply"), "STOP: unknown argument");
const target = new URL(process.env.DATABASE_URL || "");
assert.ok([
  "ep-cold-shape-ae1i1fz6-pooler.c-2.us-east-2.aws.neon.tech",
  "ep-cold-shape-ae1i1fz6.c-2.us-east-2.aws.neon.tech",
].includes(target.hostname), "STOP: database endpoint differs");
assert.equal(target.pathname, "/neondb", "STOP: database name differs");
const client = new PrismaClient({ datasources: { db: { url: target.href } } });
const entries = SUPPORTING_DOCUMENTS.map(publication => {
  const bytes = fs.readFileSync(path.join(folder, publication.sourceFileName));
  verifySupportingDocumentBytes({ reference: publication.reference, version: publication.version, document: publication, bytes });
  const pathname = `arp/supporting-publications/${publication.reference}/v${publication.version}/${publication.sha256}.pdf`;
  return { publication, bytes, pathname, url: `https://${hostname}/${pathname}` };
});
const references = entries.map(entry => entry.publication.reference);
const reviewHash = createHash("sha256").update(JSON.stringify({
  participantId, packageId, operatorId,
  documents: entries.map(entry => ({ reference: entry.publication.reference, version: entry.publication.version,
    sha256: entry.publication.sha256, byteLength: entry.publication.byteLength, url: entry.url })),
  resourceState: "WITHHELD", permissions: { canView: false, canDownload: false, canPresent: false, canTransmit: false },
})).digest("hex");

type Tx = Pick<typeof client,
  "$executeRaw" | "$queryRaw" | "user" | "userRole" |
  "commercialUtilityPack" | "commercialUtilityPackModuleRelease" |
  "commercialUtilityPackResourceRelease" | "domainEvent"
>;
async function inspect(tx: Tx) {
  const operator = await tx.user.findUnique({ where: { id: operatorId }, select: { email: true } });
  assert.equal(operator?.email, "connect@axpt.io", "STOP: operator identity differs");
  const binding = await tx.userRole.findFirst({ where: { userId: operatorId, role: { key: "ADMIN_PLATFORM" } }, select: { userId: true } });
  assert.ok(binding, "STOP: operator Admin role missing");
  const pack = await tx.commercialUtilityPack.findUnique({ where: { id: packageId }, include: {
    participant: { include: { user: { select: { email: true } } } }, modules: true,
  } });
  assert.ok(pack, "STOP: Jens CUP missing");
  assert.equal(pack.participantId, participantId, "STOP: participant differs");
  assert.equal(pack.participant.user?.email, "juxtaport@gmail.com", "STOP: recipient lineage differs");
  assert.equal(pack.reference, "FWI-26-RP-001-CUP-001", "STOP: CUP reference differs");
  assert.equal(pack.version, 1, "STOP: CUP edition differs");
  assert.ok(["PREPARING", "CURRENT"].includes(pack.state), "STOP: CUP no longer current");
  assert.equal(pack.modules.filter((entry: { module: string }) => entry.module === "DOCUMENTS").length, 1, "STOP: Documents module differs");
  for (const entry of entries) {
    const resources = await tx.commercialUtilityPackResourceRelease.findMany({ where: { packageId, resourceId: entry.publication.reference } });
    assert.ok(resources.length <= 1, "STOP: conflicting resource registration");
    if (resources.length) {
      const resource = resources[0];
      assert.equal(resource.module, "DOCUMENTS"); assert.equal(resource.resourceType, "DOCUMENT");
      assert.equal(resource.state, "WITHHELD", "STOP: resource already advanced; preserve it");
      assert.ok(!resource.canView && !resource.canDownload && !resource.canPresent && !resource.canTransmit,
        "STOP: existing permissions advanced; preserve them");
      assert.equal(resource.label, entry.publication.title);
      const metadata: unknown = resource.metadata;
      assert.ok(metadata && typeof metadata === "object" && !Array.isArray(metadata), "STOP: publication metadata missing");
      const record = metadata as Record<string, unknown>;
      assert.equal(record.fileUrl, entry.url, "STOP: registered locator differs");
      assert.equal(record.publicationVersion, entry.publication.version);
      assert.equal(record.sha256, entry.publication.sha256);
      assert.equal(record.byteLength, entry.publication.byteLength);
      assert.equal(record.mimeType, "application/pdf");
      assert.equal(record.sourceFileName, entry.publication.sourceFileName);
    }
  }
}
async function baseline(tx: Tx) {
  return JSON.stringify({
    pack: await tx.commercialUtilityPack.findUnique({ where: { id: packageId } }),
    modules: await tx.commercialUtilityPackModuleRelease.findMany({ where: { packageId }, orderBy: { id: "asc" } }),
    existing: await tx.commercialUtilityPackResourceRelease.findMany({ where: { packageId, resourceId: { notIn: references } }, orderBy: { id: "asc" } }),
  });
}
async function main() {
  await client.$transaction(async (tx: Tx) => { await tx.$executeRaw`SET TRANSACTION READ ONLY`; await inspect(tx); }, { maxWait: 30000, timeout: 60000 });
  console.log("✓ Three local PDFs match the reviewed publication checksums.");
  console.log("✓ Expected production endpoint, operator role and Jens CUP lineage verified.");
  console.log(JSON.stringify({ reviewHash, documents: entries.map(entry => ({reference:entry.publication.reference,version:entry.publication.version,bytes:entry.publication.byteLength})), resourceState:"WITHHELD", allPermissions:false }, null, 2));
  if (!apply) { console.log("REVIEW ONLY: no storage upload, database writes, release, email or deployment."); return; }
  assert.equal(process.env.ARP_SUPPORTING_DOCUMENT_REVIEW_HASH, reviewHash, "STOP: exact review confirmation missing");
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  assert.ok(token && !token.includes("[SENSITIVE]"), "STOP: private Blob credential missing");
  for (const entry of entries) {
    let existing;
    try { existing = await head(entry.url, { token }); }
    catch (error) { if (!(error instanceof Error) || error.name !== "BlobNotFoundError") throw error; }
    if (!existing) {
      const uploaded = await put(entry.pathname, entry.bytes, { access: "private", token, addRandomSuffix: false,
        allowOverwrite: false, contentType: "application/pdf" });
      assert.equal(uploaded.url, entry.url, "STOP: storage target differs; preserve uploaded object for inspection");
    }
    const bytes = await readPrivateSupportingBlob(entry.url, entry.publication.byteLength);
    verifySupportingDocumentBytes({ reference: entry.publication.reference, version: entry.publication.version, document: entry.publication, bytes });
    console.log("✓ Private stored bytes verified:", entry.publication.reference);
  }
  await client.$transaction(async (tx: Tx) => {
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPack" WHERE id = ${packageId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPackModuleRelease" WHERE "packageId" = ${packageId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPackResourceRelease" WHERE "packageId" = ${packageId} FOR UPDATE`;
    await inspect(tx); const before = await baseline(tx);
    for (const entry of entries) {
      const publication = entry.publication;
      const existing = await tx.commercialUtilityPackResourceRelease.findFirst({ where: { packageId, resourceId: publication.reference } });
      if (!existing) {
        const resource = await tx.commercialUtilityPackResourceRelease.create({ data: {
          packageId, module: "DOCUMENTS", resourceType: "DOCUMENT", resourceId: publication.reference,
          label: publication.title, state: "WITHHELD", canView: false, canDownload: false, canPresent: false, canTransmit: false,
          metadata: { publicationVersion: publication.version, sha256: publication.sha256, documentDate: publication.documentDate,
            byteLength: publication.byteLength, mimeType: "application/pdf", sourceFileName: publication.sourceFileName, fileUrl: entry.url },
        } });
        await tx.domainEvent.create({ data: { streamType: "CommercialUtilityPack", streamId: packageId,
          eventType: "REPRESENTATIVE_SUPPORTING_DOCUMENT_REGISTERED", payload: { actorUserId: operatorId,
            participantId, resourceReleaseId: resource.id, reference: publication.reference, version: publication.version,
            sha256: publication.sha256, reviewHash, reason: "Register approved supporting PDF with all access withheld; separate operator release required" } } });
      }
    }
    assert.equal(await baseline(tx), before, "STOP: pre-existing CUP state changed");
  }, { isolationLevel: "Serializable", maxWait: 30000, timeout: 60000 });
  console.log("✓ Three supporting PDFs registered; all access remains withheld.");
  console.log("No invitation, release, email, appointment change or deployment performed.");
}
main().catch(error => {
  const failure = error as { name?: string; code?: string; message?: string };
  console.error("Supporting-document preparation stopped:", failure.code || failure.name || "Unknown error");
  let message = String(failure.message || "");
  for (const secret of [target.href, target.password, decodeURIComponent(target.password)]) {
    if (secret) message = message.split(secret).join("[REDACTED]");
  }
  console.error(message.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[REDACTED_CONNECTION]"));
  console.error(apply
    ? "Inspect registration and storage state before retrying."
    : "Read-only review failed; no uploads or database writes performed.");
  process.exitCode=1;
}).finally(()=>client.$disconnect());
