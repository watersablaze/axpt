import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  ExternalEvidenceCustodyError,
  preserveExternalIntakeEvidence,
  type ExternalEvidenceStore,
} from "../../src/domains/control-center/transaction-intakes/preserveExternalIntakeEvidence";

const original = Buffer.from(
  "%PDF-1.7\nSYNTHETIC FW EVIDENCE\n%%EOF",
);

const sha256 = createHash("sha256")
  .update(original)
  .digest("hex");

const objects = new Map<string, Uint8Array>();

const store: ExternalEvidenceStore = {
  async putIfAbsent(key, bytes, contentType) {
    assert.equal(contentType, "application/pdf");

    if (objects.has(key)) return "exists";

    objects.set(key, Uint8Array.from(bytes));
    return "created";
  },

  async read(key) {
    const value = objects.get(key);

    if (!value) throw new Error("OBJECT_NOT_FOUND");

    return Uint8Array.from(value);
  },
};

async function rejected(
  operation: Promise<unknown>,
  reason: ExternalEvidenceCustodyError["reason"],
) {
  await assert.rejects(
    operation,
    (error: unknown) =>
      error instanceof ExternalEvidenceCustodyError &&
      error.reason === reason,
  );
}

async function main() {
  const first = await preserveExternalIntakeEvidence({
    store,
    bytes: original,
    expectedSha256: sha256,
  });

  assert.equal(first.disposition, "created");
  assert.equal(first.sha256, sha256);
  assert.equal(first.byteLength, original.byteLength);
  assert.equal(
    first.reference,
    `french-ward/external-intake/sha256/${sha256}.pdf`,
  );
  assert.equal(objects.size, 1);

  console.log("PASS: first write and read-back verification");

  const replay = await preserveExternalIntakeEvidence({
    store,
    bytes: original,
    expectedSha256: sha256,
  });

  assert.equal(replay.disposition, "exists");
  assert.equal(replay.reference, first.reference);
  assert.equal(objects.size, 1);

  console.log("PASS: identical replay preserves object identity");

  const changed = Buffer.from(
    "%PDF-1.7\nDIFFERENT SYNTHETIC CONTENT\n%%EOF",
  );

  await rejected(
    preserveExternalIntakeEvidence({
      store,
      bytes: changed,
      expectedSha256: sha256,
    }),
    "INVALID_EVIDENCE",
  );

  await rejected(
    preserveExternalIntakeEvidence({
      store,
      bytes: Buffer.from("NOT A PDF"),
      expectedSha256: createHash("sha256")
        .update("NOT A PDF")
        .digest("hex"),
    }),
    "INVALID_EVIDENCE",
  );

  console.log("PASS: altered bytes and invalid format rejected");

  objects.set(first.reference, Buffer.from("CORRUPTED"));

  await rejected(
    preserveExternalIntakeEvidence({
      store,
      bytes: original,
      expectedSha256: sha256,
    }),
    "HASH_MISMATCH",
  );

  objects.set(first.reference, Uint8Array.from(original));

  console.log("PASS: existing-object hash mismatch rejected");

  await rejected(
    preserveExternalIntakeEvidence({
      store: {
        ...store,
        async putIfAbsent() {
          throw new Error("CONDITIONAL_WRITE_UNSUPPORTED");
        },
      },
      bytes: original,
      expectedSha256: sha256,
    }),
    "WRITE_FAILED",
  );

  await rejected(
    preserveExternalIntakeEvidence({
      store: {
        ...store,
        async read() {
          throw new Error("READ_UNAVAILABLE");
        },
      },
      bytes: original,
      expectedSha256: sha256,
    }),
    "READ_FAILED",
  );

  console.log("PASS: storage failures close custody gate");

  const simultaneous = await Promise.all([
    preserveExternalIntakeEvidence({
      store,
      bytes: original,
      expectedSha256: sha256,
    }),
    preserveExternalIntakeEvidence({
      store,
      bytes: original,
      expectedSha256: sha256,
    }),
  ]);

  assert.equal(simultaneous[0].reference, simultaneous[1].reference);
  assert.equal(objects.size, 1);

  console.log("PASS: simultaneous idempotent custody requests");
  console.log("PASS: FW-TXN-1B.3D evidence custody contract");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
