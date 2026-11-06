import type {
  PrismaClient,
} from "@prisma/client";

import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";

/**
 * A French-Ward governing session remains valid only while
 * the canonical governing standing remains ACTIVE and unended.
 *
 * This checks institutional recognition only.
 * It grants no permission or operative authority.
 */
export async function resolveFrenchWardGoverningSessionValidityWithClient(
  params: {
    client: Pick<
      PrismaClient,
      "frenchWardGoverningOfficer"
    >;
    sessionTier: string | null | undefined;
    userId: string;
  },
): Promise<boolean> {
  if (
    params.sessionTier !==
    "french-ward-governance"
  ) {
    return true;
  }

  const standing =
    await loadCurrentFrenchWardGoverningStandingWithClient({
      client:
        params.client,
      userId:
        params.userId,
    });

  return standing?.active === true;
}
