import { createHash } from "node:crypto";
type Document = { reference: string; version: number; byteLength: number; sha256: string };
/** Byte integrity only. Caller must authorize the current recipient/resource before any read. */
export function verifySupportingDocumentBytes(input: {
  reference: string; version: number; bytes: Uint8Array;
  document: Document | null;
}) {
  const document = input.document;
  if (!document || document.reference !== input.reference || document.version !== input.version) throw new Error("SUPPORTING_DOCUMENT_PUBLICATION_UNKNOWN");
  if (input.bytes.byteLength !== document.byteLength ||
      createHash("sha256").update(input.bytes).digest("hex") !== document.sha256) {
    throw new Error("SUPPORTING_DOCUMENT_BYTES_DIFFER");
  }
  if (Buffer.from(input.bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") {
    throw new Error("SUPPORTING_DOCUMENT_FORMAT_INVALID");
  }
  return document;
}
