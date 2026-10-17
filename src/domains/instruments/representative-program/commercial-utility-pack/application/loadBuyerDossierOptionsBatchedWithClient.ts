import type { PrismaClient } from "@prisma/client";
import { loadBuyerDossierOptionsWithClient } from "./loadBuyerDossierOptionsWithClient";
import type { loadRepresentativeCommercialUtilityPackWithClient } from "./loadRepresentativeCommercialUtilityPackWithClient";

type Pack = Awaited<ReturnType<typeof loadRepresentativeCommercialUtilityPackWithClient>>;

/** An already evaluated visible CUP is required; permission decisions stay in the original evaluator. */
export async function loadBuyerDossierOptionsBatchedWithClient(input: {
  client: Pick<PrismaClient, "$queryRaw">;
  userId: string;
  pack: Pack;
}) {
  const ids = [...new Set((input.pack?.modules ?? []).flatMap(entry =>
    entry.module === "DOCUMENTS"
      ? entry.resources.filter(resource => resource.resourceType === "INSTITUTIONAL_INSTRUMENT")
          .map(resource => resource.resourceId)
      : []
  ))];
  const instruments: Array<{ id: string; kind: string }> = ids.length
    ? await input.client.$queryRaw`
        SELECT id, kind FROM public."InstitutionalInstrument"
        WHERE id = ANY(${ids}::text[])
      `
    : [];
  const byId = new Map(instruments.map(instrument => [instrument.id, instrument]));
  const allowedIds = new Set(ids);
  const reads = {
    institutionalInstrument: {
      findUnique: async (query: { where: { id?: string } }) => {
        const id = query.where.id;
        if (typeof id !== "string" || !allowedIds.has(id)) {
          throw new Error("[REPRESENTATIVE_BUYER_OPTIONS_READ_SCOPE_CONFLICT]");
        }
        return byId.get(id) ?? null;
      },
    },
  };
  type ReadClient = Parameters<typeof loadBuyerDossierOptionsWithClient>[0]["client"];
  return loadBuyerDossierOptionsWithClient({
    client: reads as unknown as ReadClient,
    userId: input.userId,
    pack: input.pack,
  });
}
