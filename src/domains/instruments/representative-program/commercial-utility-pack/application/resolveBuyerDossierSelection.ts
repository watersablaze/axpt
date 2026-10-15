import { createHash } from "node:crypto";

export type BuyerDossierPublication = Readonly<{
  resourceReleaseId: string;
  kind: "INSTITUTIONAL_PROFILE" | "SOURCE_AUTHORITY" | "DECLARATION_OF_TRUST" | "RESELLER_AGREEMENT" | "SANCTIONS_SCREENING";
  reference: string;
  version: number;
  label: string;
  // Hash the recipient projection, never an operator projection or raw evidence.
  recipientContentHash: string;
}>;

export type BuyerDossierSelectionPorts = Readonly<{
  loadPublication: (resourceReleaseId: string) => Promise<BuyerDossierPublication | null>;
  authorizeIntroductionAndTransmission: (publication: BuyerDossierPublication) => Promise<boolean>;
}>;

/** Read-only preflight. An allowed selection is NOT a grant or delivery receipt.
 * The eventual invitation command must re-run this under its governance locks.
 * Personal download permission is deliberately not a buyer-retention grant.
 */
export async function resolveBuyerDossierSelection(input: {
  resourceReleaseIds: readonly string[];
  ports: BuyerDossierSelectionPorts;
}) {
  const ids = input.resourceReleaseIds;
  if (!Array.isArray(ids) || !ids.length || ids.length > 5 ||
      ids.some(id => typeof id !== "string" || !id.trim() || id !== id.trim() || id.length > 191) ||
      new Set(ids).size !== ids.length) {
    return { allowed: false as const, reason: "INVALID_SELECTION" };
  }
  const publications: BuyerDossierPublication[] = [];
  for (const id of [...ids].sort()) {
    const publication = await input.ports.loadPublication(id);
    if (!publication || publication.resourceReleaseId !== id ||
        !["INSTITUTIONAL_PROFILE", "SOURCE_AUTHORITY", "DECLARATION_OF_TRUST", "RESELLER_AGREEMENT", "SANCTIONS_SCREENING"].includes(publication.kind) ||
        !publication.reference.trim() || !publication.label.trim() ||
        !Number.isInteger(publication.version) || publication.version < 1 ||
        !/^[a-f0-9]{64}$/.test(publication.recipientContentHash)) {
      return { allowed: false as const, reason: "PUBLICATION_UNAVAILABLE" };
    }
    if (!await input.ports.authorizeIntroductionAndTransmission(publication)) {
      return { allowed: false as const, reason: "SHARING_NOT_AUTHORIZED" };
    }
    publications.push(publication);
  }
  if (new Set(publications.map(item => item.kind)).size !== publications.length ||
      new Set(publications.map(item => item.reference)).size !== publications.length) {
    return { allowed: false as const, reason: "PUBLICATION_CONTRADICTION" };
  }
  const manifest = publications.map(item => ({ ...item }));
  const reviewHash = createHash("sha256").update(JSON.stringify({
    policy: "BUYER_DOSSIER_SELECTION_V1", publications: manifest,
  })).digest("hex");
  return {
    allowed: true as const,
    policy: "BUYER_DOSSIER_SELECTION_V1" as const,
    publications: manifest,
    reviewHash,
    establishesRecipientAccess: false as const,
    establishesDownloadPermission: false as const,
  };
}
