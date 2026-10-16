import "server-only";

import { prisma } from "@/infrastructure/db/prisma";

import { reissueRepresentativeOnboardingAccessWithClient } from "../commands/reissueRepresentativeOnboardingAccessWithClient";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

export async function reissueRepresentativeOnboardingAccess(params: {
  intakeId: string;
  accessExpiresAt: Date;
  issuedAt?: Date;
}) {
  return reissueRepresentativeOnboardingAccessWithClient({
    client: prisma as unknown as RepresentativeOnboardingPersistenceClient,
    intakeId: params.intakeId,
    accessExpiresAt: params.accessExpiresAt,
    issuedAt: params.issuedAt,
  });
}
