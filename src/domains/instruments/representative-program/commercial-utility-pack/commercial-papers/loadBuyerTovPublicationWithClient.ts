import { loadRepresentativeCommercialPaper } from "./loadRepresentativeCommercialPaper";

/** Read-only source projection. Dossier selection also checks communication and introduction authority.
 * Recipient callers must enforce their exact dossier/item grant before returning these bytes.
 */
export async function loadBuyerTovPublicationWithClient(input: Parameters<typeof loadRepresentativeCommercialPaper>[0]) {
  const paper = await loadRepresentativeCommercialPaper({...input, requireTransmission: true});
  if (!paper || paper.key !== "TRANSACTION_OVERVIEW" || paper.status !== "Approved for representative use" ||
      !paper.publicationHash || !paper.publicationHtml) return null;
  return {kind: "TRANSACTION_OVERVIEW" as const, reference: paper.reference, version: paper.version,
    recipientContentHash: paper.publicationHash, content: {title: paper.title, reference: paper.reference,
      version: paper.version, publicationHash: paper.publicationHash, html:paper.publicationHtml, publicationRevision:paper.publicationRevision}};
}
