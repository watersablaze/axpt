import type { PrismaClient } from "@prisma/client";

type ReadClient = Pick<
  PrismaClient,
  "representativeProgramParticipant" | "commercialUtilityPack"
>;

const moduleOrder = [
  "REPRESENTATION",
  "COMMERCIAL_PARAMETERS",
  "DOCUMENTS",
  "OPERATING_BOUNDARIES",
] as const;

/**
 * Read V1 CUP visibility for an authenticated user.
 * userId must come from the server principal, never a request parameter.
 */

type RepresentativePackProjection = {
  participantId: string;
  reference: string;
  version: number;
  audience: string;
  state: string;
  releaseState: string;
  modules: Array<{
    module: string;
    state: string;
  }>;
  resources: Array<{
    id: string;
    module: string;
    resourceType: string;
    resourceId: string;
    label: string | null;
    state: string;
    canView: boolean;
    canDownload: boolean;
    canPresent: boolean;
    canTransmit: boolean;
  }>;
};

export async function loadRepresentativeCommercialUtilityPackWithClient(
  params: { client: ReadClient; userId: string },
) {
  const userId = params.userId.trim();
  if (!userId) {
    throw new Error("[REPRESENTATIVE_CUP_USER_REQUIRED]");
  }

  const participants = await params.client
    .representativeProgramParticipant.findMany({
      where: { userId },
      take: 2,
      select: { id: true },
    });

  if (participants.length === 0) return null;
  if (participants.length !== 1) {
    throw new Error("[REPRESENTATIVE_CUP_PARTICIPANT_CONTRADICTION]");
  }

  const participantId = participants[0].id;
  const pack: RepresentativePackProjection | null = await params.client.commercialUtilityPack.findUnique({
    where: {
      participantId_version: { participantId, version: 1 },
    },
    select: {
      participantId: true,
      reference: true,
      version: true,
      audience: true,
      state: true,
      releaseState: true,
      modules: {
        select: { module: true, state: true },
      },
      resources: {
        where: { state: "RELEASED", canView: true },
        select: {
          id: true,
          module: true,
          resourceType: true,
          resourceId: true,
          label: true,
          state: true,
          canView: true,
          canDownload: true,
          canPresent: true,
          canTransmit: true,
        },
      },
    },
  });

  if (!pack) return null;
  if (pack.participantId !== participantId || pack.version !== 1) {
    throw new Error("[REPRESENTATIVE_CUP_IDENTITY_CONTRADICTION]");
  }

  if (
    pack.audience !== "REPRESENTATIVE" ||
    !["PREPARING", "CURRENT"].includes(pack.state) ||
    !["PARTIAL", "RELEASED"].includes(pack.releaseState)
  ) return null;

  if (
    pack.modules.length !== moduleOrder.length ||
    new Set(pack.modules.map(entry => entry.module)).size !== moduleOrder.length ||
    moduleOrder.some(module =>
      !pack.modules.some(entry => entry.module === module)
    )
  ) {
    throw new Error("[REPRESENTATIVE_CUP_MODULE_REGISTRY_CONTRADICTION]");
  }

  const modules = moduleOrder.flatMap(module => {
    const entry = pack.modules.find(item => item.module === module)!;
    if (entry.state !== "RELEASED") return [];

    const resources = pack.resources
      .filter(resource =>
        resource.module === module &&
        resource.state === "RELEASED" &&
        resource.canView === true
      )
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(resource => ({
        id: resource.id,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        label: resource.label,
        canDownload: resource.canDownload,
        canPresent: resource.canPresent,
        canTransmit: resource.canTransmit,
      }));

    return resources.length ? [{ module, resources }] : [];
  });

  if (!modules.length) return null;

  return {
    reference: pack.reference,
    version: pack.version,
    modules,
  };
}
