import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";

import { assembleMasterAgreementEvidence } from "../../src/domains/instruments/representative-program/onboarding/commands/assembleMasterAgreementEvidence";

const pdf = (body: string) =>
  new TextEncoder().encode(`%PDF-1.7\n${body}`);

async function main() {
  const uploads: Array<{ key: string; bytes: Uint8Array; sha256: string }> = [];
  const signedPdf = pdf("signed agreement");
  const auditPdf = pdf("Acrobat audit report");
  const expectedDocumentHash = createHash("sha256")
    .update(signedPdf)
    .digest("hex");
  const completedAt = new Date("2026-09-24T10:00:00.000Z");

  const store = {
    async putPrivate(input: {
      key: string;
      bytes: Uint8Array;
      contentType: "application/pdf";
      sha256: string;
    }) {
      uploads.push({
        key: input.key,
        bytes: Uint8Array.from(input.bytes),
        sha256: input.sha256,
      });

      // Simulate the caller changing its inputs during the first upload.
      if (uploads.length === 1) {
        signedPdf.fill(0);
        completedAt.setUTCFullYear(2040);
      }

      return {
        uri: `s3://arp-private-evidence/${input.key}`,
        access: "private",
      };
    },
  };

  const base = {
    reference: "ARP-MASTER-JENS-001",
    signerEmail: "Jens@Example.Test",
    adobeAgreementId: "adobe-agreement-1",
    completedAt,
    reviewedByUserId: "admin-1",
    reviewedAt: new Date("2026-09-24T11:00:00.000Z"),
    operatorConfirmedAllSignatures: true,
    signedPdf,
    auditPdf,
  };

  const receipt = await assembleMasterAgreementEvidence({
    ...base,
    store,
  });

  assert.equal(receipt.signerEmail, "jens@example.test");
  assert.equal(receipt.signedDocument.contentHash, expectedDocumentHash);
  assert.equal(receipt.completedAt.getUTCFullYear(), 2026);
  assert.equal(uploads.length, 2);
  assert.equal(uploads[0].sha256, expectedDocumentHash);
  assert.equal(uploads[0].bytes[0], 0x25);

  const unusedStore = {
    async putPrivate() {
      throw new Error("UPLOAD_SHOULD_NOT_RUN");
    },
  };

  await assert.rejects(
    assembleMasterAgreementEvidence({
      ...base,
      completedAt: new Date("2026-09-24T10:00:00.000Z"),
      signedPdf: pdf("same"),
      auditPdf: pdf("same"),
      store: unusedStore,
    }),
    /ARP_MASTER_AGREEMENT_DISTINCT_AUDIT_REQUIRED/,
  );

  await assert.rejects(
    assembleMasterAgreementEvidence({
      ...base,
      completedAt: new Date("2026-09-24T12:00:00.000Z"),
      signedPdf: pdf("signed"),
      store: unusedStore,
    }),
    /ARP_MASTER_AGREEMENT_REVIEW_PRECEDES_COMPLETION/,
  );

  await assert.rejects(
    assembleMasterAgreementEvidence({
      ...base,
      completedAt: new Date("2026-09-24T10:00:00.000Z"),
      signedPdf: pdf("signed"),
      store: {
        async putPrivate() {
          return {
            uri: "https://example.test/document.pdf",
            access: "public",
          };
        },
      },
    }),
    /PRIVATE_STORAGE_REQUIRED/,
  );

  process.stdout.write("ARP_MASTER_AGREEMENT_EVIDENCE_SMOKE_OK\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
