import { createHash } from "node:crypto";

type Publication = Readonly<{ reference: string; version: number; byteLength: number; sha256: string }>;
export type SupportingDocumentAccess = Readonly<{
  publication: Publication; canDownload: boolean; fileUrl: string;
}>;
/** The authorization port must resolve identity, current release and document registration.
 * No caller-selected URL is fetched. Authenticate before invoking this internal function.
 */
export async function readSupportingDocument(input: {
  action: "VIEW" | "DOWNLOAD";
  authorize: () => Promise<SupportingDocumentAccess | null>;
  read: (url: string, maximumBytes: number) => Promise<Uint8Array>;
}) {
  if (input.action !== "VIEW" && input.action !== "DOWNLOAD") return null;
  const access = await input.authorize();
  if (!access || (input.action === "DOWNLOAD" && !access.canDownload)) return null;
  const publication = access.publication;
  if (!/^[a-f0-9]{64}$/.test(publication.sha256) || !Number.isSafeInteger(publication.byteLength) ||
      publication.byteLength < 5 || publication.byteLength > 20 * 1024 * 1024) throw new Error("SUPPORTING_DOCUMENT_REGISTRATION_INVALID");
  const locator = new URL(access.fileUrl);
  const expectedPath = `/arp/supporting-publications/${publication.reference}/v${publication.version}/${publication.sha256}.pdf`;
  if (locator.protocol !== "https:" || locator.hostname !== "zjlswvetvtzvn453.private.blob.vercel-storage.com" ||
      locator.pathname !== expectedPath || locator.port || locator.username || locator.password || locator.search || locator.hash) {
    throw new Error("SUPPORTING_DOCUMENT_LOCATOR_INVALID");
  }
  const bytes = await input.read(locator.href, publication.byteLength);
  if (bytes.byteLength !== publication.byteLength || createHash("sha256").update(bytes).digest("hex") !== publication.sha256 ||
      Buffer.from(bytes.subarray(0,5)).toString("ascii") !== "%PDF-") throw new Error("SUPPORTING_DOCUMENT_BYTES_DIFFER");
  // Recheck after storage I/O; a changed/revoked release must not be returned.
  const current = await input.authorize();
  if (!current || (input.action === "DOWNLOAD" && !current.canDownload) ||
      current.fileUrl !== access.fileUrl || JSON.stringify(current.publication) !== JSON.stringify(publication)) return null;
  return { bytes, reference: publication.reference, version: publication.version };
}
