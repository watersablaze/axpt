/** Internal storage adapter; URL validation belongs to readSupportingDocument. */
export async function readPrivateSupportingBlob(url: string, maximumBytes: number): Promise<Uint8Array> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token || token.includes("[SENSITIVE]")) throw new Error("SUPPORTING_STORAGE_UNAVAILABLE");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
  if (!response.ok || !response.body) throw new Error("SUPPORTING_STORAGE_READ_FAILED");
  const declared = response.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) !== maximumBytes)) {
    await response.body.cancel(); throw new Error("SUPPORTING_STORAGE_LENGTH_INVALID");
  }
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > maximumBytes) { await reader.cancel(); throw new Error("SUPPORTING_STORAGE_LENGTH_INVALID"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (length !== maximumBytes) throw new Error("SUPPORTING_STORAGE_LENGTH_INVALID");
  return Buffer.concat(chunks);
}
