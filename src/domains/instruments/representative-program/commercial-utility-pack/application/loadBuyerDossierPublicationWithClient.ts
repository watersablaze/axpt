import { loadRepresentativeSupportingDocumentWithClient } from "../supporting-documents/loadRepresentativeSupportingDocumentWithClient";
import { createHash } from "node:crypto";
import { loadRepresentativeCommercialUtilityPackResourceWithClient } from "./loadRepresentativeCommercialUtilityPackResourceWithClient";
import { loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient } from "./loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient";
import { loadSourceAuthorityPresentationWithClient } from "@/domains/instruments/source-authority/presentation/loadSourceAuthorityPresentationWithClient";

type Client = Parameters<typeof loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient>[0]["client"] & Parameters<typeof loadRepresentativeSupportingDocumentWithClient>[0]["client"];
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
/** Source lookup only. Never call from a recipient route without its dossier/grant checks. */
export async function loadBuyerDossierPublicationWithClient(input: {
  client: Client; representativeUserId: string; resourceReleaseId: string;
}) {
  const supporting = await loadRepresentativeSupportingDocumentWithClient({client:input.client,userId:input.representativeUserId,resourceReleaseId:input.resourceReleaseId});
  if (supporting) {
    const content = supporting.publication;
    return {kind:content.kind,reference:content.reference,version:content.version,recipientContentHash:hash(content),content};
  }
  const profile = await loadRepresentativeCommercialUtilityPackResourceWithClient({
    client: input.client, userId: input.representativeUserId, resourceReleaseId: input.resourceReleaseId,
  });
  if (profile?.kind === "INSTITUTIONAL_PROFILE") {
    return { kind: "INSTITUTIONAL_PROFILE" as const, reference: profile.content.reference,
      version: profile.content.version, recipientContentHash: hash(profile.content), content: profile.content };
  }
  const source = await loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient({
    client: input.client, userId: input.representativeUserId, resourceReleaseId: input.resourceReleaseId,
  });
  if (source?.kind !== "SOURCE_AUTHORITY") return null;
  const content = await loadSourceAuthorityPresentationWithClient({
    client: input.client, instrumentReference: source.presentation.identity.instrumentReference, audience: "RECIPIENT",
  });
  if (content.audience !== "RECIPIENT" || content.operatorRecord.length ||
      content.identity.instrumentId !== source.presentation.identity.instrumentId ||
      content.identity.versionNumber !== source.presentation.identity.versionNumber) return null;
  return { kind: "SOURCE_AUTHORITY" as const, reference: content.identity.instrumentReference,
    version: content.identity.versionNumber, recipientContentHash: hash(content), content };
}
