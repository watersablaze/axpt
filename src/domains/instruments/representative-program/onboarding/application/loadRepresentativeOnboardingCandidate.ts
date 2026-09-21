import "server-only";

import { prisma } from "@/infrastructure/db/prisma";

import {
  representativeCandidateSubmissionSchema,
  type RepresentativeCandidateSubmissionInput,
} from "../http/candidateSubmissionSchema";
import type { RepresentativeOnboardingPersistenceClient } from "../persistence";
import { resolveRepresentativeOnboardingAccessWithClient } from "../queries/resolveRepresentativeOnboardingAccessWithClient";

export type RepresentativeOnboardingCandidateView = Readonly<{
  id: string;
  reference: string;
  status: string;
  candidateDisplayName: string;
  candidateEmail: string;
  accessExpiresAt: Date | null;
  submittedAt: Date | null;
  submission: RepresentativeCandidateSubmissionInput | null;
}>;

function parseCandidateSubmission(
  value: unknown,
): RepresentativeCandidateSubmissionInput | null {
  const parsed = representativeCandidateSubmissionSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
}

export async function loadRepresentativeOnboardingCandidate(params: {
  rawAccessToken: string;
  at?: Date;
}): Promise<RepresentativeOnboardingCandidateView | null> {
  const access = await resolveRepresentativeOnboardingAccessWithClient({
    client: prisma as unknown as RepresentativeOnboardingPersistenceClient,
    rawAccessToken: params.rawAccessToken,
    at: params.at,
  });

  if (!access.accessible || !access.intake) {
    return null;
  }

  const intake = access.intake;

  /**
   * CANDIDATE-SAFE PROJECTION.
   *
   * Intentionally omitted:
   * - accessTokenHash
   * - accessRevokedAt
   * - qualificationDecision
   * - internalNotes
   * - createdByUserId
   * - admittedParticipantId
   * - review / qualification internals
   */
  return {
    id: intake.id,
    reference: intake.reference,
    status: intake.status,
    candidateDisplayName: intake.candidateDisplayName,
    candidateEmail: intake.candidateEmail,
    accessExpiresAt: intake.accessExpiresAt,
    submittedAt: intake.submittedAt,
    submission: parseCandidateSubmission(intake.submission),
  };
}
