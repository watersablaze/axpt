import { projectFrenchWardInstitutionalProfile } from
  "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { projectRepresentativeOperatingBoundaries } from
  "../../operating-boundaries/projectRepresentativeOperatingBoundaries";
import { loadRepresentativeCommercialUtilityPackWithClient } from
  "./loadRepresentativeCommercialUtilityPackWithClient";

type Client =
  Parameters<typeof loadRepresentativeCommercialUtilityPackWithClient>[0]["client"];

export async function loadRepresentativeCommercialUtilityPackResourceWithClient(
  params: {
    client: Client;
    userId: string;
    resourceReleaseId: string;
  },
) {
  const resourceReleaseId = params.resourceReleaseId.trim();
  if (!resourceReleaseId || resourceReleaseId.length > 191) return null;

  // Recheck the requesting user's current package and view permission.
  const pack = await loadRepresentativeCommercialUtilityPackWithClient({
    client: params.client,
    userId: params.userId,
  });
  if (!pack) return null;

  const matches = pack.modules.flatMap(entry =>
    entry.resources
      .filter(resource => resource.id === resourceReleaseId)
      .map(resource => ({ module: entry.module, resource })),
  );
  if (matches.length === 0) return null;
  if (matches.length !== 1) {
    throw new Error("[REPRESENTATIVE_CUP_RESOURCE_IDENTITY_CONTRADICTION]");
  }

  const { module, resource } = matches[0];
  if (resource.resourceType !== "STRUCTURED_CONTENT") return null;

  if (module === "REPRESENTATION") {
    const content = projectFrenchWardInstitutionalProfile();
    if (
      content.status !== "CURRENT" ||
      content.reference !== resource.resourceId
    ) return null;

    return {
      kind: "INSTITUTIONAL_PROFILE" as const,
      packageReference: pack.reference,
      resourceReleaseId,
      content,
    };
  }

  if (module === "OPERATING_BOUNDARIES") {
    const content = projectRepresentativeOperatingBoundaries();
    if (
      content.status !== "CURRENT" ||
      content.reference !== resource.resourceId
    ) return null;

    return {
      kind: "OPERATING_BOUNDARIES" as const,
      packageReference: pack.reference,
      resourceReleaseId,
      content,
    };
  }

  // Unsupported sources remain unavailable until their governed viewer exists.
  return null;
}
