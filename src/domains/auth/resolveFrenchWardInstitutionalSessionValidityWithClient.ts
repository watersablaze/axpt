import type {
  PrismaClient,
} from "@prisma/client";

import {
  loadCurrentFrenchWardInstitutionalParticipantWithClient,
} from "@/domains/institutions/french-ward/participants/loadCurrentFrenchWardInstitutionalParticipantWithClient";

/**
 * A French-Ward institutional session remains valid only while
 * canonical participant recognition remains ACTIVE and unended.
 *
 * Recognition only. No operative authority is granted here.
 */
export async function
resolveFrenchWardInstitutionalSessionValidityWithClient(
  params: {
    client: Pick<
      PrismaClient,
      "frenchWardInstitutionalParticipant"
    >;
    sessionTier: string | null | undefined;
    userId: string;
  },
): Promise<boolean> {
  if (
    params.sessionTier !==
    "french-ward-institutional"
  ) {
    return true;
  }

  const participant =
    await loadCurrentFrenchWardInstitutionalParticipantWithClient({
      client:
        params.client,
      userId:
        params.userId,
    });

  return participant?.active === true;
}
