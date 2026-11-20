import { findCommercialPaper } from "../commercial-papers/catalog";
import { findSupportingDocument } from "../supporting-documents/catalog";
import type { PrismaClient } from "@prisma/client";
import { projectFrenchWardInstitutionalProfile } from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { loadRepresentativeCommercialUtilityPackWithClient } from "./loadRepresentativeCommercialUtilityPackWithClient";
export type BuyerDossierOption = { id: string; label: string; canTransmit: boolean };
export async function loadBuyerDossierOptionsWithClient(input: {
  client: Parameters<typeof loadRepresentativeCommercialUtilityPackWithClient>[0]["client"] & Pick<PrismaClient,"institutionalInstrument">;
  userId: string;
  pack?: Awaited<ReturnType<typeof loadRepresentativeCommercialUtilityPackWithClient>>;
}) {
  const pack = input.pack === undefined ? await loadRepresentativeCommercialUtilityPackWithClient(input) : input.pack;
  const options: BuyerDossierOption[] = [];
  if (!pack) return options;
  const profile = projectFrenchWardInstitutionalProfile();
  for (const entry of pack.modules) for (const resource of entry.resources) {
    if (entry.module === "REPRESENTATION" && resource.resourceType === "STRUCTURED_CONTENT" && resource.resourceId === profile.reference) {
      options.push({id:resource.id,label:resource.label || "French-Ward Institutional Profile",canTransmit:resource.canTransmit});
    } else if (entry.module === "DOCUMENTS" && resource.resourceType === "STRUCTURED_CONTENT") {
      const paper = findCommercialPaper(resource.resourceId);
      if (paper?.key === "TRANSACTION_OVERVIEW" && paper.status === "Approved for representative use") options.push({id:resource.id,label:paper.title,canTransmit:resource.canTransmit});
    } else if (entry.module === "DOCUMENTS" && resource.resourceType === "DOCUMENT") {
      const publication=findSupportingDocument(resource.resourceId,1);
      if (publication) options.push({id:resource.id,label:publication.title,canTransmit:resource.canTransmit});
    } else if (entry.module === "DOCUMENTS" && resource.resourceType === "INSTITUTIONAL_INSTRUMENT") {
      const instrument = await input.client.institutionalInstrument.findUnique({where:{id:resource.resourceId},select:{kind:true}});
      if (instrument?.kind === "SOURCE_AUTHORITY") options.push({id:resource.id,label:resource.label || "Source Authority Instrument",canTransmit:resource.canTransmit});
    }
  }
  return options;
}
