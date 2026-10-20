import { createHash } from "node:crypto";
import { createSupportingDocumentByteCache } from "./supportingDocumentByteCache";

type Input = { uri: string; sha256: string; read: () => Promise<Uint8Array> };
type Environment = Record<string, string | undefined>;

/** Bytes only. Call exclusively after the canonical ownership/evidence checks. */
export function createAgreementByteReader({
  cache = createSupportingDocumentByteCache({ maximumBytes: 12 * 1024 * 1024, maximumEntries: 2, ttlMs: 60_000 }),
  environment = (): Environment => process.env,
} = {}) {
  let lastCredentialScope = "";
  function credentialScope(uri: string) {
    const env = environment();
    const keys = uri.startsWith("s3://")
      ? ["AWS_ENDPOINT_URL_S3", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AXPT_TRANSACTION_DOCUMENT_BUCKET"]
      : ["BLOB_READ_WRITE_TOKEN"];
    const values = keys.map(key => env[key]?.trim() || "");
    if (values.some(value => !value || value.includes("[SENSITIVE]"))) {
      cache.clear(); lastCredentialScope = "";
      throw new Error("[REPRESENTATIVE_CUP_PRIVATE_STORAGE_UNAVAILABLE]");
    }
    return createHash("sha256").update(JSON.stringify([keys, values])).digest("hex");
  }
  return async function readVerified(input: Input): Promise<Uint8Array> {
    if (!/^[a-f0-9]{64}$/.test(input.sha256)) throw new Error("[REPRESENTATIVE_CUP_AGREEMENT_INTEGRITY_FAILED]");
    const scope = credentialScope(input.uri);
    if (lastCredentialScope !== scope) { cache.clear(); lastCredentialScope = scope; }
    const key = createHash("sha256").update(JSON.stringify([scope, input.uri, input.sha256])).digest("hex");
    const hit = cache.get(key);
    if (hit) return hit;
    const bytes = Uint8Array.from(await input.read());
    if (Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-" ||
        createHash("sha256").update(bytes).digest("hex") !== input.sha256) {
      throw new Error("[REPRESENTATIVE_CUP_AGREEMENT_INTEGRITY_FAILED]");
    }
    if (credentialScope(input.uri) !== scope || lastCredentialScope !== scope) {
      cache.clear(); lastCredentialScope = "";
      throw new Error("[REPRESENTATIVE_CUP_PRIVATE_STORAGE_CHANGED]");
    }
    cache.set(key, bytes);
    return bytes.slice();
  };
}

export const readCachedAgreementBytes = createAgreementByteReader();
