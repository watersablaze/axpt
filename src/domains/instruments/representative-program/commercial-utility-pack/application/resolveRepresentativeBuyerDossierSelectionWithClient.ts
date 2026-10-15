import { loadRepresentativeSupportingDocumentWithClient } from "../supporting-documents/loadRepresentativeSupportingDocumentWithClient";
import { createHash } from "node:crypto";
import { projectFrenchWardInstitutionalProfile } from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { loadSourceAuthorityPresentationWithClient } from "@/domains/instruments/source-authority/presentation/loadSourceAuthorityPresentationWithClient";
import { REPRESENTATIVE_AUTHORITY_KEY } from "../../contracts";
import { resolveRepresentativeProgramAuthorityApplicabilityWithClient } from "../../applicability/resolveRepresentativeProgramAuthorityApplicabilityWithClient";
import { loadRepresentativeCommercialUtilityPackResourceWithClient } from "./loadRepresentativeCommercialUtilityPackResourceWithClient";
import { loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient } from "./loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from "./resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
import { resolveBuyerDossierSelection } from "./resolveBuyerDossierSelection";

type Client =
  Parameters<typeof loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient>[0]["client"] &
  Parameters<typeof resolveRepresentativeCommercialUtilityPackConsumptionWithClient>[0]["client"] &
  Parameters<typeof loadRepresentativeSupportingDocumentWithClient>[0]["client"];
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Internal server consumer only. userId comes from the authenticated principal.
 * No evidence bytes, signing, grant creation, email, or permission mutation.
 */
export async function resolveRepresentativeBuyerDossierSelectionWithClient(input: {
  client: Client;
  userId: string;
  appointmentId: string;
  resourceReleaseIds: readonly string[];
  at?: Date;
}) {
  const at = input.at ?? new Date();
  if (!input.userId.trim() || !input.appointmentId.trim() || !Number.isFinite(at.getTime())) {
    throw new Error("[BUYER_DOSSIER_IDENTITY_OR_TIME_INVALID]");
  }
  return resolveBuyerDossierSelection({
    resourceReleaseIds: input.resourceReleaseIds,
    ports: {
      loadPublication: async resourceReleaseId => {
        const supporting = await loadRepresentativeSupportingDocumentWithClient({client:input.client,userId:input.userId,resourceReleaseId});
        if (supporting) {
          const publication=supporting.publication;
          return {resourceReleaseId,kind:publication.kind,reference:publication.reference,version:publication.version,
            label:publication.title,recipientContentHash:hash(publication)};
        }
        const profile = await loadRepresentativeCommercialUtilityPackResourceWithClient({
          client: input.client, userId: input.userId, resourceReleaseId,
        });
        if (profile?.kind === "INSTITUTIONAL_PROFILE") {
          const current = projectFrenchWardInstitutionalProfile();
          if (current.status !== "CURRENT" || profile.content.reference !== current.reference ||
              profile.content.version !== current.version) return null;
          return { resourceReleaseId, kind: "INSTITUTIONAL_PROFILE", reference: current.reference,
            version: current.version, label: "French-Ward Institutional Profile", recipientContentHash: hash(current) };
        }
        const source = await loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient({
          client: input.client, userId: input.userId, resourceReleaseId,
        });
        if (source?.kind !== "SOURCE_AUTHORITY") return null;
        const recipient = await loadSourceAuthorityPresentationWithClient({
          client: input.client, instrumentReference: source.presentation.identity.instrumentReference,
          audience: "RECIPIENT",
        });
        if (recipient.audience !== "RECIPIENT" || recipient.operatorRecord.length ||
            recipient.identity.instrumentId !== source.presentation.identity.instrumentId ||
            recipient.identity.versionNumber !== source.presentation.identity.versionNumber) return null;
        return { resourceReleaseId, kind: "SOURCE_AUTHORITY", reference: recipient.identity.instrumentReference,
          version: recipient.identity.versionNumber, label: recipient.identity.instrumentTitle,
          recipientContentHash: hash(recipient) };
      },
      authorizeIntroductionAndTransmission: async publication => {
        const context = { documentClass: publication.kind === "INSTITUTIONAL_PROFILE"
          ? "FRENCH_WARD_INSTITUTIONAL_PROFILE" : publication.kind };
        const transmission = await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
          client: input.client, userId: input.userId, appointmentId: input.appointmentId,
          resourceReleaseId: publication.resourceReleaseId, action: "TRANSMIT", context, at,
        });
        if (!transmission.allowed) return false;
        const introduction = await resolveRepresentativeProgramAuthorityApplicabilityWithClient({
          client: input.client, request: { appointmentId: input.appointmentId,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.INTRODUCTION, context, at },
        });
        return introduction.exercisable && introduction.applicable && introduction.approvalRequired !== true;
      },
    },
  });
}
