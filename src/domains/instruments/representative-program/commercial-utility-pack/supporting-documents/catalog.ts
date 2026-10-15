/** Candidate publication identifiers. Registration alone releases no document or permission.
 * Dates describe the supplied documents; they do not attest execution or current validity.
 * Keep original bytes outside public/ and source control.
 */
export const SUPPORTING_DOCUMENTS = [
  {
    "kind": "DECLARATION_OF_TRUST",
    "reference": "FW-BAF-TRUST-2026-001",
    "version": 1,
    "title": "Declaration of Trust, Custodianship, and Economic Alignment",
    "documentDate": "2026-03-12",
    "sourceFileName": "FWI_BC_Declaration_of_Trust.pdf",
    "sha256": "c3bd9ee3eb60a3ce049b780eba8f55492ae4cf92e71597b9e74775271a415089",
    "byteLength": 4098297,
    "pageCount": 3,
    "disclosureNote": "Signed source copy; historical officer titles preserved."
  },
  {
    "kind": "RESELLER_AGREEMENT",
    "reference": "FW-BAF-RESELLER-2026-001",
    "version": 1,
    "title": "Exclusive Certified Reseller & Agent Agreement",
    "documentDate": "2026-02-13",
    "sourceFileName": "CERTIFIED-RESELLER-AGENT-AGREEMENT-BAF-FWI-2026.pdf",
    "sha256": "3f3021ae8e6af6052a18a9579ae5e54948f1a1af4a2ceec68d3e7378f90077eb",
    "byteLength": 1096328,
    "pageCount": 3,
    "disclosureNote": "Supplied copy contains a blacked-out section; original file preserved."
  },
  {
    "kind": "SANCTIONS_SCREENING",
    "reference": "FW-BAF-SCREENING-2026-001",
    "version": 1,
    "title": "Sanctions Screening Report — Amadou Toure and Banque Atlantique",
    "documentDate": "2026-03-19",
    "sourceFileName": "03192026 Sanctions Screening Report JMS_260603_095536.pdf",
    "sha256": "32a74838e3e4ce9a1f8dd888f6285ca03b103ddc8e4ec38b82843f94171f2a7a",
    "byteLength": 168560,
    "pageCount": 3,
    "disclosureNote": "Confidential historical screening record for the named subjects as of the report date. Contains personal identifiers."
  }
] as const;
export type SupportingDocumentKind = (typeof SUPPORTING_DOCUMENTS)[number]["kind"];
export function findSupportingDocument(reference: string, version: number) {
  return SUPPORTING_DOCUMENTS.find(entry => entry.reference === reference && entry.version === version) ?? null;
}
