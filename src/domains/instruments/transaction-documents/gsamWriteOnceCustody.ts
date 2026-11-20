import { createHash } from "node:crypto";

export type GsamCustodyFormat = "pdf" | "html";
export type GsamCustodyStore = {
  /** Must implement an atomic create-if-absent operation. Never emulate with GET then PUT. */
  putIfAbsent(key: string, bytes: Uint8Array, contentType: string): Promise<"created" | "exists">;
  read(key: string): Promise<Uint8Array>;
};

export class GsamCustodyError extends Error {
  readonly reason: "INVALID_ARTIFACT" | "CONDITIONAL_WRITE_UNSUPPORTED" | "WRITE_FAILED" | "READ_FAILED" | "HASH_MISMATCH";
  constructor(reason: GsamCustodyError["reason"]) {
    super(`GSAM custody unavailable: ${reason}`);
    this.name = "GsamCustodyError";
    this.reason = reason;
  }
}

const sha256 = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");
const validHash = (value: string) => /^[0-9a-f]{64}$/.test(value);

export async function preserveGsamWriteOnceArtifact(params: {
  store: GsamCustodyStore;
  format: GsamCustodyFormat;
  expectedSha256: string;
  bytes: Uint8Array;
}): Promise<{ key: string; sha256: string; disposition: "created" | "exists" }> {
  const { store, format, expectedSha256, bytes } = params;
  if ((format !== "pdf" && format !== "html") || !validHash(expectedSha256) ||
      !(bytes instanceof Uint8Array) || bytes.byteLength === 0 || sha256(bytes) !== expectedSha256) {
    throw new GsamCustodyError("INVALID_ARTIFACT");
  }
  if (format === "pdf" && Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") {
    throw new GsamCustodyError("INVALID_ARTIFACT");
  }
  if (format === "html" && !/^\s*<!doctype html/i.test(Buffer.from(bytes.subarray(0, 256)).toString("utf8"))) {
    throw new GsamCustodyError("INVALID_ARTIFACT");
  }
  const key = `gsam/sco/sha256/${expectedSha256}.${format}`;
  const contentType = format === "pdf" ? "application/pdf" : "text/html; charset=utf-8";
  let disposition: "created" | "exists";
  try {
    disposition = await store.putIfAbsent(key, bytes, contentType);
  } catch (error) {
    if (error instanceof GsamCustodyError) throw error;
    throw new GsamCustodyError("WRITE_FAILED");
  }
  if (disposition !== "created" && disposition !== "exists") throw new GsamCustodyError("WRITE_FAILED");
  let stored: Uint8Array;
  try {
    stored = await store.read(key);
  } catch {
    throw new GsamCustodyError("READ_FAILED");
  }
  if (!(stored instanceof Uint8Array) || sha256(stored) !== expectedSha256) {
    throw new GsamCustodyError("HASH_MISMATCH");
  }
  return { key, sha256: expectedSha256, disposition };
}
