import type { PrismaClient } from "@prisma/client";
import { loadRepresentativeCommercialUtilityPackWithClient } from "./loadRepresentativeCommercialUtilityPackWithClient";

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

/** One workspace read; the existing loader still evaluates release and visibility. */
export async function loadRepresentativeCommercialUtilityPackSnapshotWithClient(params: {
  client: Pick<PrismaClient, "$queryRaw">;
  userId: string;
}) {
  const userId = params.userId.trim();
  if (!userId) throw new Error("[REPRESENTATIVE_CUP_USER_REQUIRED]");
  const rows: Array<{ id: string; pack: RepresentativePackProjection | null }> =
    await params.client.$queryRaw`
      SELECT participant.id,
        CASE WHEN pack.id IS NULL THEN NULL ELSE jsonb_build_object(
          'participantId', pack."participantId", 'reference', pack.reference,
          'version', pack.version, 'audience', pack.audience,
          'state', pack.state, 'releaseState', pack."releaseState",
          'modules', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('module', m.module, 'state', m.state))
            FROM public."CommercialUtilityPackModuleRelease" m
            WHERE m."packageId" = pack.id
          ), '[]'::jsonb),
          'resources', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', r.id, 'module', r.module, 'resourceType', r."resourceType",
              'resourceId', r."resourceId", 'label', r.label, 'state', r.state,
              'canView', r."canView", 'canDownload', r."canDownload",
              'canPresent', r."canPresent", 'canTransmit', r."canTransmit"
            ))
            FROM public."CommercialUtilityPackResourceRelease" r
            WHERE r."packageId" = pack.id AND r.state = 'RELEASED' AND r."canView" = true
          ), '[]'::jsonb)
        ) END AS pack
      FROM public."RepresentativeProgramParticipant" participant
      LEFT JOIN public."CommercialUtilityPack" pack
        ON pack."participantId" = participant.id AND pack.version = 1
      WHERE participant."userId" = ${userId}
      LIMIT 2
    `;

  const reads = {
    representativeProgramParticipant: {
      findMany: async (query: { where: { userId?: string }; take?: number }) => {
        if (query.where.userId !== userId || query.take !== 2) {
          throw new Error("[REPRESENTATIVE_CUP_SNAPSHOT_READ_SCOPE_CONFLICT]");
        }
        return rows.map(row => ({ id: row.id }));
      },
    },
    commercialUtilityPack: {
      findUnique: async (query: { where: { participantId_version: {
        participantId: string; version: number;
      } } }) => {
        const key = query.where.participantId_version;
        if (rows.length !== 1 || key.participantId !== rows[0].id || key.version !== 1) {
          throw new Error("[REPRESENTATIVE_CUP_SNAPSHOT_READ_SCOPE_CONFLICT]");
        }
        return rows[0].pack;
      },
    },
  };
  type ReadClient = Parameters<typeof loadRepresentativeCommercialUtilityPackWithClient>[0]["client"];
  return loadRepresentativeCommercialUtilityPackWithClient({
    client: reads as unknown as ReadClient, userId,
  });
}
