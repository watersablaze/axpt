import type {
  RepresentativeOnboardingStatus,
  RepresentativeQualificationDecision,
} from "./contracts";

export type RepresentativeOnboardingIntakeRecord = Readonly<{
  id: string;
  reference: string;

  status: RepresentativeOnboardingStatus;
  qualificationDecision: RepresentativeQualificationDecision;

  candidateDisplayName: string;
  candidateEmail: string;
  submission: unknown | null;

  internalNotes: string | null;

  accessTokenHash: string | null;
  accessIssuedAt: Date | null;
  accessExpiresAt: Date | null;
  accessRevokedAt: Date | null;

  submittedAt: Date | null;
  reviewStartedAt: Date | null;
  qualifiedAt: Date | null;
  admittedAt: Date | null;

  admittedParticipantId: string | null;
  createdByUserId: string | null;

  createdAt: Date;
  updatedAt: Date;
}>;

export type RepresentativeOnboardingTransitionRecord = Readonly<{
  id: string;
  intakeId: string;
  fromStatus: RepresentativeOnboardingStatus | null;
  toStatus: RepresentativeOnboardingStatus;
  actorUserId: string | null;
  reason: string | null;
  metadata: unknown | null;
  occurredAt: Date;
  createdAt: Date;
}>;

/**
 * Temporary structural persistence contract.
 *
 * The canonical Prisma schema already contains these delegates.
 * This interface avoids coupling source verification to a locally
 * generated Prisma client until the onboarding migration is applied
 * and the generated client is refreshed in an isolated release gate.
 */
export type RepresentativeOnboardingPersistenceClient = Readonly<{
  representativeOnboardingIntake: {
    create(args: unknown): Promise<RepresentativeOnboardingIntakeRecord>;

    findUnique(
      args: unknown,
    ): Promise<RepresentativeOnboardingIntakeRecord | null>;

    update(args: unknown): Promise<RepresentativeOnboardingIntakeRecord>;

    updateMany(args: unknown): Promise<Readonly<{ count: number }>>;
  };

  representativeOnboardingTransition: {
    create(args: unknown): Promise<RepresentativeOnboardingTransitionRecord>;
  };
}>;
