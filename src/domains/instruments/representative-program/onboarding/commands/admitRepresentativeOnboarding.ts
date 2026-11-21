import { REPRESENTATIVE_ONBOARDING_STATUS } from "../contracts";

import type {
  RepresentativeOnboardingTransactionClient,
  RepresentativeOnboardingTransactionRunner,
} from "../governance/runRepresentativeOnboardingTransaction";

import { runRepresentativeOnboardingTransaction } from "../governance/runRepresentativeOnboardingTransaction";

import { REPRESENTATIVE_PROGRAM_STANDING } from "../../contracts";

import { createRepresentativeProgramParticipantWithClient } from "../../commands/createRepresentativeProgramParticipantWithClient";

import { transitionRepresentativeOnboardingWithClient } from "./transitionRepresentativeOnboardingWithClient";

/**
 * Explicit institutional crossing:
 *
 * QUALIFIED ≠ ADMITTED
 *
 * Admission creates the canonical Program Participant and therefore
 * allocates the Program docket.
 *
 * Initial standing is deliberately PROVISIONAL.
 *
 * ACTIVE is reserved for later activation after the governing
 * relationship, Appointment Instrument and Authority Schedule have
 * been completed.
 */
export async function admitRepresentativeOnboardingWithClient(params: {
  client: RepresentativeOnboardingTransactionClient;
  intakeId: string;
  actorUserId: string;
  participantUserId?: string | null;
  occurredAt?: Date;
}) {
  const actorUserId = params.actorUserId.trim();

  if (!actorUserId) {
    throw new Error("[ARP_ONBOARDING_ADMISSION_ACTOR_REQUIRED]");
  }

  const intake = await params.client.representativeOnboardingIntake.findUnique({
    where: {
      id: params.intakeId,
    },
  });

  if (!intake) {
    throw new Error(
      `[ARP_ONBOARDING_ADMISSION_INTAKE_NOT_FOUND] ${params.intakeId}`,
    );
  }

  if (
    intake.status === REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED &&
    intake.admittedParticipantId
  ) {
    const participant =
      await params.client.representativeProgramParticipant.findUnique({
        where: {
          id: intake.admittedParticipantId,
        },
      });

    if (!participant) {
      throw new Error(
        `[ARP_ONBOARDING_ADMISSION_PARTICIPANT_MISSING] ${intake.admittedParticipantId}`,
      );
    }

    return {
      intake,
      participant,
      created: false,
    } as const;
  }

  if (intake.status !== REPRESENTATIVE_ONBOARDING_STATUS.QUALIFIED) {
    throw new Error(
      `[ARP_ONBOARDING_ADMISSION_REQUIRES_QUALIFIED] status=${intake.status}`,
    );
  }

  if (intake.admittedParticipantId) {
    throw new Error(
      `[ARP_ONBOARDING_ADMISSION_LINK_CONTRADICTION] ${intake.admittedParticipantId}`,
    );
  }

  const occurredAt = params.occurredAt ?? new Date();

  const participant = await createRepresentativeProgramParticipantWithClient({
    client: params.client,
    displayName: intake.candidateDisplayName,
    standing: REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
    actorUserId,
    userId: params.participantUserId ?? null,
    occurredAt,
  });

  const transitioned = await transitionRepresentativeOnboardingWithClient({
    client: params.client,
    intakeId: intake.id,
    toStatus: REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED,
    actorUserId,
    reason: "Qualified representative candidate admitted to Program",
    occurredAt,
    data: {
      admittedParticipantId: participant.id,
      admittedAt: occurredAt,
    },
    metadata: {
      docketReference: participant.docketReference,
      participantStanding: REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
    },
  });

  return {
    intake: transitioned.intake,
    participant,
    created: true,
  } as const;
}

export async function admitRepresentativeOnboarding(params: {
  client: RepresentativeOnboardingTransactionRunner;
  intakeId: string;
  actorUserId: string;
  participantUserId?: string | null;
  occurredAt?: Date;
}) {
  return runRepresentativeOnboardingTransaction(params.client, (tx) =>
    admitRepresentativeOnboardingWithClient({
      client: tx,
      intakeId: params.intakeId,
      actorUserId: params.actorUserId,
      participantUserId: params.participantUserId,
      occurredAt: params.occurredAt,
    }),
  );
}
