import { createHash, timingSafeEqual } from "node:crypto";

/** Server-side GSAM frozen-artifact boundary. Call only after authorization and grant checks. */
export type GsamArtifactKind = "pdf" | "html";

export type GsamArtifactDescriptor = Readonly<{
  key: string;
  sha256: string;
  kind: GsamArtifactKind;
}>;

export type GsamObjectReader = Readonly<{
  read(key: string): Promise<Uint8Array>;
}>;

export class GsamArtifactVerificationError extends Error {
  readonly reason: "INVALID_DESCRIPTOR" | "READ_FAILED" | "HASH_MISMATCH" | "INVALID_BYTES";

  constructor(reason: "INVALID_DESCRIPTOR" | "READ_FAILED" | "HASH_MISMATCH" | "INVALID_BYTES") {
    super(`GSAM artifact unavailable: ${reason}`);
    this.reason = reason;
    this.name = "GsamArtifactVerificationError";
  }
}

const HASH_RE = /^[a-f0-9]{64}$/;
const SAFE_KEY_RE = /^(?:[a-zA-Z0-9_-]+\/)*[a-f0-9]{64}\.(?:pdf|html)$/;

/**
 * Verifies retrieved bytes, never a caller-supplied checksum header or S3 ETag.
 * The descriptor must originate from the authoritative edition registry, not request params.
 * A successful read is not release authorization.
 */
export async function readVerifiedGsamArtifact(
  reader: GsamObjectReader,
  descriptor: GsamArtifactDescriptor,
): Promise<Readonly<{ bytes: Uint8Array; contentType: string; sha256: string }>> {
  const { key, sha256, kind } = descriptor;
  if (
    !HASH_RE.test(sha256) ||
    (kind !== "pdf" && kind !== "html") ||
    !SAFE_KEY_RE.test(key) ||
    !key.endsWith(`${sha256}.${kind}`)
  ) {
    throw new GsamArtifactVerificationError("INVALID_DESCRIPTOR");
  }

  let bytes: Uint8Array;
  try {
    bytes = await reader.read(key); // Strict GET; never readIfExists() or a public URL.
  } catch {
    throw new GsamArtifactVerificationError("READ_FAILED");
  }
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    throw new GsamArtifactVerificationError("INVALID_BYTES");
  }

  const actual = createHash("sha256").update(bytes).digest();
  const expected = Buffer.from(sha256, "hex");
  if (!timingSafeEqual(actual, expected)) {
    throw new GsamArtifactVerificationError("HASH_MISMATCH");
  }

  if (kind === "pdf") {
    if (bytes.byteLength < 20_000 || Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") {
      throw new GsamArtifactVerificationError("INVALID_BYTES");
    }
  } else {
    const opening = Buffer.from(bytes.subarray(0, 512)).toString("utf8").replace(/^\uFEFF/, "").trimStart();
    if (!/^<!doctype html\s*>/i.test(opening)) {
      throw new GsamArtifactVerificationError("INVALID_BYTES");
    }
  }

  return {
    bytes,
    contentType: kind === "pdf" ? "application/pdf" : "text/html; charset=utf-8",
    sha256,
  };
}
