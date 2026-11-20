import { createHash, timingSafeEqual } from "node:crypto";

export type ExternalEvidenceStore = {
  // This must be atomic at the storage provider.
  // GET-then-PUT is not an acceptable implementation.
  putIfAbsent(
    key: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<"created" | "exists">;

  read(key: string): Promise<Uint8Array>;
};

export type ExternalEvidenceCustodyReceipt = Readonly<{
  reference: string;
  sha256: string;
  format: "pdf";
  byteLength: number;
  disposition: "created" | "exists";
}>;

export class ExternalEvidenceCustodyError extends Error {
  constructor(
    readonly reason:
      | "INVALID_EVIDENCE"
      | "WRITE_FAILED"
      | "READ_FAILED"
      | "HASH_MISMATCH",
  ) {
    super(`FW_TXN_CUSTODY_${reason}`);
    this.name = "ExternalEvidenceCustodyError";
  }
}

const MAX_BYTES = 25_000_000;

function digest(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function hashesEqual(left: string, right: string) {
  if (
    !/^[0-9a-f]{64}$/.test(left) ||
    !/^[0-9a-f]{64}$/.test(right)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(left, "hex"),
    Buffer.from(right, "hex"),
  );
}

export async function preserveExternalIntakeEvidence(input: {
  store: ExternalEvidenceStore;
  bytes: Uint8Array;
  expectedSha256: string;
}): Promise<ExternalEvidenceCustodyReceipt> {
  const { store, bytes, expectedSha256 } = input;

  if (
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength < 5 ||
    bytes.byteLength > MAX_BYTES ||
    !/^[0-9a-f]{64}$/.test(expectedSha256) ||
    !hashesEqual(digest(bytes), expectedSha256) ||
    Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-"
  ) {
    throw new ExternalEvidenceCustodyError("INVALID_EVIDENCE");
  }

  const reference =
    `french-ward/external-intake/sha256/${expectedSha256}.pdf`;

  let disposition: "created" | "exists";

  try {
    disposition = await store.putIfAbsent(
      reference,
      bytes,
      "application/pdf",
    );
  } catch {
    throw new ExternalEvidenceCustodyError("WRITE_FAILED");
  }

  if (disposition !== "created" && disposition !== "exists") {
    throw new ExternalEvidenceCustodyError("WRITE_FAILED");
  }

  let stored: Uint8Array;

  try {
    stored = await store.read(reference);
  } catch {
    throw new ExternalEvidenceCustodyError("READ_FAILED");
  }

  if (
    !(stored instanceof Uint8Array) ||
    stored.byteLength !== bytes.byteLength ||
    !hashesEqual(digest(stored), expectedSha256)
  ) {
    throw new ExternalEvidenceCustodyError("HASH_MISMATCH");
  }

  return {
    reference,
    sha256: expectedSha256,
    format: "pdf",
    byteLength: bytes.byteLength,
    disposition,
  };
}
