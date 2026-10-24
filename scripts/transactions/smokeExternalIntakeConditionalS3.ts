import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  createExternalIntakeConditionalS3Store,
  ExternalIntakeS3Error,
  type ExternalIntakeS3Sender,
} from "../../src/domains/control-center/transaction-intakes/externalIntakeConditionalS3Store";

import {
  preserveExternalIntakeEvidence,
} from "../../src/domains/control-center/transaction-intakes/preserveExternalIntakeEvidence";

const config = {
  endpoint: "https://storage.example.test",
  region: "test-region",
  accessKeyId: "synthetic",
  secretAccessKey: "synthetic",
  bucket: "fw-test",
};

const bytes = Buffer.from(
  "%PDF-1.7\nSYNTHETIC EXTERNAL INTAKE\n%%EOF",
);

const hash = createHash("sha256")
  .update(bytes)
  .digest("hex");

const objects = new Map<string, Uint8Array>();

let writes = 0;

const sender: ExternalIntakeS3Sender = async (command) => {
  if (command instanceof PutObjectCommand) {
    assert.equal(command.input.Bucket, config.bucket);
    assert.equal(command.input.IfNoneMatch, "*");
    assert.equal(
      command.input.ContentType,
      "application/pdf",
    );

    const key = command.input.Key!;

    if (objects.has(key)) {
      throw Object.assign(
        new Error("PreconditionFailed"),
        { name: "PreconditionFailed", $metadata: { httpStatusCode: 412 } },
      );
    }

    writes++;

    objects.set(
      key,
      Uint8Array.from(command.input.Body as Uint8Array),
    );

    return {};
  }

  if (command instanceof GetObjectCommand) {
    const stored = objects.get(command.input.Key!);

    if (!stored) throw new Error("NoSuchKey");

    return {
      Body: {
        async transformToByteArray() {
          return Uint8Array.from(stored);
        },
      },
    };
  }

  throw new Error("UNEXPECTED_COMMAND");
};

async function main() {
  const store = createExternalIntakeConditionalS3Store(
    config,
    sender,
  );

  const first = await preserveExternalIntakeEvidence({
    store,
    bytes,
    expectedSha256: hash,
  });

  assert.equal(first.disposition, "created");
  assert.equal(writes, 1);

  console.log("PASS: conditional create and read-back");

  const replay = await preserveExternalIntakeEvidence({
    store,
    bytes,
    expectedSha256: hash,
  });

  assert.equal(replay.disposition, "exists");
  assert.equal(replay.reference, first.reference);
  assert.equal(writes, 1);

  console.log("PASS: 412 preserves existing object");

  objects.set(
    first.reference,
    Buffer.from("CORRUPTED"),
  );

  await assert.rejects(
    preserveExternalIntakeEvidence({
      store,
      bytes,
      expectedSha256: hash,
    }),
    /FW_TXN_CUSTODY_HASH_MISMATCH/,
  );

  objects.set(first.reference, Uint8Array.from(bytes));

  console.log("PASS: corrupt existing object rejected");

  const unsupported = createExternalIntakeConditionalS3Store(
    config,
    async () => {
      throw Object.assign(new Error("NotImplemented"), {
        name: "NotImplemented",
        $metadata: { httpStatusCode: 501 },
      });
    },
  );

  await assert.rejects(
    unsupported.putIfAbsent(
      "synthetic-key",
      bytes,
      "application/pdf",
    ),
    (error: unknown) =>
      error instanceof ExternalIntakeS3Error &&
      error.reason === "CONDITIONAL_WRITE_UNSUPPORTED",
  );

  console.log("PASS: unsupported conditional writes rejected");

  const conflict = createExternalIntakeConditionalS3Store(
    config,
    async () => {
      throw Object.assign(new Error("Conflict"), {
        $metadata: { httpStatusCode: 409 },
      });
    },
  );

  await assert.rejects(
    conflict.putIfAbsent(
      "synthetic-key",
      bytes,
      "application/pdf",
    ),
    /FW_TXN_S3_WRITE_FAILED/,
  );

  console.log("PASS: ambiguous 409 fails closed");

  await assert.rejects(
    async () =>
      createExternalIntakeConditionalS3Store({
        ...config,
        endpoint: "http://unsafe.example.test",
      }),
    /FW_TXN_S3_CONFIG_INVALID/,
  );

  console.log("PASS: invalid configuration rejected");
  console.log("PASS: FW-TXN-1B.3E S3 adapter contract");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
