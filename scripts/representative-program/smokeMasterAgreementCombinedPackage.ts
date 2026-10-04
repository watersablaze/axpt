import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";

import {
  assembleMasterAgreementEvidence,
} from "../../src/domains/instruments/representative-program/onboarding/commands/assembleMasterAgreementEvidence";

const pdf = (body: string) =>
  new TextEncoder().encode(
    `%PDF-1.7\n${body}`,
  );

async function main() {
  const uploads: Array<{
    key: string;
    bytes: Uint8Array;
    sha256: string;
  }> = [];

  const combinedPdf =
    pdf(
      [
        "SIGNED AGREEMENT",
        "SIGNATURE CERTIFICATE",
        "ACROBAT AUDIT TRAIL",
      ].join("\n"),
    );

  const expectedHash =
    createHash("sha256")
      .update(combinedPdf)
      .digest("hex");

  const receipt =
    await assembleMasterAgreementEvidence({
      store: {
        async putPrivate(input: {
          key: string;
          bytes: Uint8Array;
          contentType: "application/pdf";
          sha256: string;
        }) {
          uploads.push({
            key: input.key,
            bytes:
              Uint8Array.from(input.bytes),
            sha256:
              input.sha256,
          });

          return {
            uri:
              `s3://arp-private-evidence/${input.key}`,
            access:
              "private",
          };
        },
      },

      reference:
        "ARP-MASTER-COMBINED-001",

      signerEmail:
        "Jens@Example.Test",

      adobeAgreementId:
        "adobe-combined-1",

      completedAt:
        new Date(
          "2026-09-24T21:07:54.000Z",
        ),

      sourceTimezone:
        "GMT",

      reviewedByUserId:
        "admin-1",

      reviewedAt:
        new Date(
          "2026-09-24T22:00:00.000Z",
        ),

      operatorConfirmedAllSignatures:
        true,

      packageMode:
        "COMBINED_ACROBAT_PACKAGE",

      combinedPdf,
    });

  assert.equal(
    receipt.packageMode,
    "COMBINED_ACROBAT_PACKAGE",
  );

  assert.equal(
    receipt.sourceTimezone,
    "GMT",
  );

  assert.equal(
    receipt.completedAt.toISOString(),
    "2026-09-24T21:07:54.000Z",
  );

  assert.equal(
    receipt.signerEmail,
    "jens@example.test",
  );

  assert.equal(
    uploads.length,
    1,
  );

  assert.equal(
    uploads[0].sha256,
    expectedHash,
  );

  assert.match(
    uploads[0].key,
    /\/combined-[a-f0-9]{64}\.pdf$/,
  );

  assert.equal(
    receipt.signedDocument.uri,
    receipt.auditTrail.uri,
  );

  assert.equal(
    receipt.signedDocument.contentHash,
    receipt.auditTrail.contentHash,
  );

  assert.equal(
    receipt.signedDocument.contentHash,
    expectedHash,
  );

  assert.equal(
    uploads[0].bytes[0],
    0x25,
  );

  const unusedStore = {
    async putPrivate() {
      throw new Error(
        "UPLOAD_SHOULD_NOT_RUN",
      );
    },
  };

  await assert.rejects(
    assembleMasterAgreementEvidence({
      store:
        unusedStore,

      reference:
        "ARP-MASTER-COMBINED-002",

      signerEmail:
        "jens@example.test",

      adobeAgreementId:
        "adobe-combined-2",

      completedAt:
        new Date(
          "2026-09-24T10:00:00.000Z",
        ),

      reviewedByUserId:
        "admin-1",

      reviewedAt:
        new Date(
          "2026-09-24T11:00:00.000Z",
        ),

      operatorConfirmedAllSignatures:
        true,

      packageMode:
        "COMBINED_ACROBAT_PACKAGE",
    }),
    /ARP_MASTER_AGREEMENT_COMBINED_PACKAGE_REQUIRED/,
  );

  await assert.rejects(
    assembleMasterAgreementEvidence({
      store:
        unusedStore,

      reference:
        "ARP-MASTER-COMBINED-003",

      signerEmail:
        "jens@example.test",

      adobeAgreementId:
        "adobe-combined-3",

      completedAt:
        new Date(
          "2026-09-24T10:00:00.000Z",
        ),

      reviewedByUserId:
        "admin-1",

      reviewedAt:
        new Date(
          "2026-09-24T11:00:00.000Z",
        ),

      operatorConfirmedAllSignatures:
        true,

      packageMode:
        "COMBINED_ACROBAT_PACKAGE",

      combinedPdf:
        new TextEncoder().encode(
          "NOT_A_PDF",
        ),
    }),
    /ARP_MASTER_AGREEMENT_COMBINED_ACROBAT_PACKAGE_PDF_REQUIRED/,
  );

  process.stdout.write(
    "ARP_MASTER_AGREEMENT_COMBINED_PACKAGE_SMOKE_OK\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
