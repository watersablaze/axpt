import "server-only";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { TOV_PUBLICATION } from "@/domains/institutions/french-ward/tovPublication";
import { createNeonObjectStorage } from "@/domains/instruments/transaction-documents/neonObjectStorage";
import { readVerifiedGsamArtifact } from "@/domains/instruments/transaction-documents/gsamVerifiedArtifact";
import { FW_TOV_R04_PDF } from "./tovFrozenPdfDescriptor";

/**
 * FW-CD-1A: read a preapproved frozen PDF only.
 * No runtime HTML-to-PDF rendering, no fallback to a different publication,
 * no recipient grants, storage writes, or commercial issuance.
 */
export async function getAdminFrozenTovPdf(): Promise<null | Readonly<{
  bytes: Uint8Array;
  filename: string;
  sha256: string;
}>> {
  const principal = await getPrincipal();
  if (!principal || !isAdmin(principal)) return null;

  const descriptor = FW_TOV_R04_PDF;
  if (
    TOV_PUBLICATION.reference !== descriptor.reference ||
    TOV_PUBLICATION.version !== descriptor.edition ||
    TOV_PUBLICATION.publicationRevision !== descriptor.publicationRevision ||
    TOV_PUBLICATION.publicationHash !== descriptor.publicationHash
  ) {
    throw new Error("FW_TOV_PUBLICATION_IDENTITY_MISMATCH");
  }

  const store = createNeonObjectStorage();
  if (!store) throw new Error("FW_TOV_STORAGE_UNAVAILABLE");

  // Reuse the existing GSAM frozen-artifact byte verification boundary.
  // Its reader verifies the full SHA-256 and PDF header, not an S3 ETag.
  const result = await readVerifiedGsamArtifact(store, {
    key: descriptor.storageKey,
    sha256: descriptor.sha256,
    kind: "pdf",
  });
  if (result.bytes.byteLength !== descriptor.byteLength) {
    throw new Error("FW_TOV_PDF_LENGTH_MISMATCH");
  }
  return { bytes: result.bytes, filename: descriptor.downloadName, sha256: result.sha256 };
}
