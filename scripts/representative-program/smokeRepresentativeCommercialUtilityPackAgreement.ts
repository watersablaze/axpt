import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { loadRepresentativeCommercialUtilityPackAgreementWithClient as load } from
  "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackAgreementWithClient";

async function main() {
  const bytes = Buffer.from("%PDF-1.7\nTEST AGREEMENT\n%%EOF");
  const evidence = {
    evidenceType: "DOCUMENT",
    subjectType: "EXECUTION",
    uri: "s3://test-bucket/private/signed.pdf",
    contentHash: createHash("sha256").update(bytes).digest("hex"),
    metadata: { operatorConfirmedAllSignatures: true },
  };
  const agreement = {
    id: "agreement-a",
    reference: "TEST-MA-001",
    kind: "REPRESENTATIVE_PROGRAM_AGREEMENT",
    status: "EXECUTED",
    evidence: [evidence],
  };
  const participant = {
    id: "participant-a",
    onboardingIntake: {
      status: "ADMITTED",
      admittedParticipantId: "participant-a",
      masterAgreementInstrumentId: "agreement-a",
      masterAgreementInstrument: agreement,
    },
  };
  const resource = {
    id: "release-a",
    module: "DOCUMENTS",
    resourceType: "INSTITUTIONAL_INSTRUMENT",
    resourceId: "agreement-a",
    label: "Test agreement",
    state: "RELEASED",
    canView: true,
    canDownload: false,
    canPresent: false,
    canTransmit: false,
  };
  const pack = {
    participantId: participant.id,
    reference: "TEST-CUP",
    version: 1,
    audience: "REPRESENTATIVE",
    state: "PREPARING",
    releaseState: "PARTIAL",
    modules: [
      { module: "REPRESENTATION", state: "WITHHELD" },
      { module: "COMMERCIAL_PARAMETERS", state: "WITHHELD" },
      { module: "DOCUMENTS", state: "RELEASED" },
      { module: "OPERATING_BOUNDARIES", state: "WITHHELD" },
    ],
    resources: [resource],
  };

  const fake = {
    representativeProgramParticipant: {
      findMany: async (query: { where: { userId: string } }) =>
        query.where.userId === "user-a" ? [participant] : [],
    },
    commercialUtilityPack: { findUnique: async () => pack },
  } as unknown as Parameters<typeof load>[0]["client"];

  let reads = 0;
  let returnedBytes: Uint8Array = bytes;
  const read = (userId = "user-a", resourceReleaseId = "release-a") =>
    load({
      client: fake,
      userId,
      resourceReleaseId,
      bucket: "test-bucket",
      read: async key => {
        assert.equal(key, "private/signed.pdf");
        reads++;
        return returnedBytes;
      },
    });

  assert.equal((await read())?.reference, agreement.reference);
  assert.equal((await read())?.canDownload, false);
  console.log("✓ owned released agreement reads its private signed PDF");

  reads = 0;
  assert.equal(await read("user-b"), null);
  assert.equal(await read("user-a", "other-release"), null);
  resource.state = "WITHHELD";
  assert.equal(await read(), null);
  resource.state = "RELEASED";
  resource.canView = false;
  assert.equal(await read(), null);
  resource.canView = true;
  pack.modules[2].state = "READY";
  assert.equal(await read(), null);
  pack.modules[2].state = "RELEASED";
  assert.equal(reads, 0);
  console.log("✓ ownership, withholding, view denial, and module state block storage reads");

  resource.resourceId = "other-agreement";
  assert.equal(await read(), null);
  resource.resourceId = agreement.id;
  agreement.status = "DRAFT";
  assert.equal(await read(), null);
  agreement.status = "EXECUTED";
  participant.onboardingIntake.masterAgreementInstrumentId = "other-agreement";
  assert.equal(await read(), null);
  participant.onboardingIntake.masterAgreementInstrumentId = agreement.id;
  console.log("✓ agreement identity, execution, and canonical binding are required");

  evidence.uri = "s3://other-bucket/private/signed.pdf";
  assert.equal(await read(), null);
  evidence.uri = "https://example.test/signed.pdf";
  assert.equal(await read(), null);
  evidence.uri = "s3://test-bucket/private/signed.pdf";
  evidence.metadata.operatorConfirmedAllSignatures = false;
  assert.equal(await read(), null);
  evidence.metadata.operatorConfirmedAllSignatures = true;
  assert.equal(reads, 0);
  console.log("✓ foreign/public locators and unconfirmed evidence fail closed");

  returnedBytes = Buffer.from("%PDF-1.7\nALTERED\n%%EOF");
  await assert.rejects(read, /INTEGRITY_FAILED/);
  console.log("✓ altered signed PDF is rejected");

  const blobHostname = "test-store.private.blob.vercel-storage.com";
  const blobUrl = `https://${blobHostname}/private/signed.pdf`;
  evidence.uri = blobUrl;
  let blobReads = 0;

  const readPrivateBlob = () => load({
    client: fake,
    userId: "user-a",
    resourceReleaseId: resource.id,
    bucket: "",
    blobHostname,
    read: async () => {
      throw new Error("Unexpected S3 read");
    },
    readBlob: async url => {
      assert.equal(url, blobUrl);
      blobReads += 1;
      return returnedBytes;
    },
  });

  // The same hash check must reject altered bytes from either backend.
  await assert.rejects(readPrivateBlob, /INTEGRITY_FAILED/);
  assert.equal(blobReads, 1);

  for (const uri of [
    "https://other-store.private.blob.vercel-storage.com/private/signed.pdf",
    "https://test-store.public.blob.vercel-storage.com/private/signed.pdf",
    `${blobUrl}?redirect=1`,
    `${blobUrl}#fragment`,
    "http://test-store.private.blob.vercel-storage.com/private/signed.pdf",
  ]) {
    evidence.uri = uri;
    assert.equal(await readPrivateBlob(), null);
  }

  assert.equal(blobReads, 1);
  console.log("✓ private Blob reads require the exact host and preserve integrity checks");

  console.log("CUP_1H_REPRESENTATIVE_AGREEMENT_OK");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
