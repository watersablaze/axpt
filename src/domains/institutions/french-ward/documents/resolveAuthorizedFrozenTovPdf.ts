import { isAdmin } from "@/domains/auth/isAdmin";
import { readVerifiedGsamArtifact, type GsamObjectReader } from "@/domains/instruments/transaction-documents/gsamVerifiedArtifact";
import { FW_TOV_R04_PDF } from "./tovFrozenPdfDescriptor";

export type TovPublicationIdentity = Readonly<{
  reference: string;
  version: number;
  publicationRevision: number;
  publicationHash: string;
}>;

export type TovActor = Readonly<{
  roles?: string[];
  permissions?: string[];
}> | null;

/**
 * Pure-injected custody decision for FW-CD-1A.
 * Production supplies its actual persisted principal, canonical publication
 * and private object reader. Tests substitute only those dependencies.
 * Never turns fixture identity into an HTTP/session bypass.
 */
export async function resolveAuthorizedFrozenTovPdf(args: {
  actor: TovActor;
  publication: TovPublicationIdentity;
  reader: GsamObjectReader | null;
}): Promise<null | Readonly<{
  bytes: Uint8Array;
  filename: string;
  sha256: string;
}>> {
  if (!isAdmin(args.actor)) return null;

  const descriptor = FW_TOV_R04_PDF;
  if (
    args.publication.reference !== descriptor.reference ||
    args.publication.version !== descriptor.edition ||
    args.publication.publicationRevision !== descriptor.publicationRevision ||
    args.publication.publicationHash !== descriptor.publicationHash
  ) {
    throw new Error("FW_TOV_PUBLICATION_IDENTITY_MISMATCH");
  }

  if (!args.reader) throw new Error("FW_TOV_STORAGE_UNAVAILABLE");

  const result = await readVerifiedGsamArtifact(args.reader, {
    key: descriptor.storageKey,
    sha256: descriptor.sha256,
    kind: "pdf",
  });
  if (result.bytes.byteLength !== descriptor.byteLength) {
    throw new Error("FW_TOV_PDF_LENGTH_MISMATCH");
  }
  return { bytes: result.bytes, filename: descriptor.downloadName, sha256: result.sha256 };
}
