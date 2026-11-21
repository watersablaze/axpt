import "server-only";

import { prisma } from "@/infrastructure/db/prisma";

import { createRepresentativeOnboardingInvitationWithClient } from "../commands/createRepresentativeOnboardingInvitationWithClient";
import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

export type IssueRepresentativeOnboardingInvitationInput = Readonly<{
  candidateDisplayName: string;
  candidateEmail: string;
  createdByUserId: string;
  accessExpiresAt: Date;
  issuedAt?: Date;
}>;

/**
 * Application boundary for operator-issued candidate invitations.
 *
 * The repository's shared generated Prisma client may lag this branch
 * while work is isolated. The ARP persistence contract is deliberately
 * structural, so the generated-client compatibility boundary lives here
 * rather than leaking casts into routes or domain commands.
 */
export async function issueRepresentativeOnboardingInvitation(
  input: IssueRepresentativeOnboardingInvitationInput,
) {
  return createRepresentativeOnboardingInvitationWithClient({
    client: prisma as unknown as RepresentativeOnboardingPersistenceClient,
    candidateDisplayName: input.candidateDisplayName,
    candidateEmail: input.candidateEmail,
    createdByUserId: input.createdByUserId,
    accessExpiresAt: input.accessExpiresAt,
    issuedAt: input.issuedAt,
  });
}
