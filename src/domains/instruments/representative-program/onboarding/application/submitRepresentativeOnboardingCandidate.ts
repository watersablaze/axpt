import "server-only";

import { prisma } from "@/infrastructure/db/prisma";

import type { RepresentativeOnboardingSubmission } from "../contracts";
import type { RepresentativeOnboardingPersistenceClient } from "../persistence";
import { resolveRepresentativeOnboardingAccessWithClient } from "../queries/resolveRepresentativeOnboardingAccessWithClient";
import { submitRepresentativeOnboardingWithClient } from "../commands/submitRepresentativeOnboardingWithClient";

type RepresentativeOnboardingTransactionClient = Readonly<{
  $transaction<T>(
    operation: (tx: RepresentativeOnboardingPersistenceClient) => Promise<T>,
  ): Promise<T>;
}>;

export async function submitRepresentativeOnboardingCandidate(params: {
  rawAccessToken: string;
  submission: RepresentativeOnboardingSubmission;
  occurredAt?: Date;
}) {
  const client = prisma as unknown as RepresentativeOnboardingTransactionClient;

  return client.$transaction(async (tx) => {
    const occurredAt = params.occurredAt ?? new Date();

    const access = await resolveRepresentativeOnboardingAccessWithClient({
      client: tx,
      rawAccessToken: params.rawAccessToken,
      at: occurredAt,
    });

    if (!access.accessible || !access.intake) {
      throw new Error("[ARP_ONBOARDING_CANDIDATE_ACCESS_DENIED]");
    }

    return submitRepresentativeOnboardingWithClient({
      client: tx,
      intakeId: access.intake.id,
      submission: params.submission,
      occurredAt,
    });
  });
}
