import type { PrismaClient } from "@prisma/client";

export type RepresentativeProgramParticipantUserLinkClient = Pick<
  PrismaClient,
  | "user"
  | "representativeProgramParticipant"
  | "domainEvent"
>;

const STREAM_TYPE =
  "REPRESENTATIVE_PROGRAM_PARTICIPANT";

const EVENT_TYPE =
  "REPRESENTATIVE_PARTICIPANT_USER_LINKED";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/**
 * REP-1B.1
 *
 * Bind one canonical AXPT User identity to one admitted
 * Representative Program Participant.
 *
 * Invariants:
 * - participant must exist;
 * - participant must derive from an ADMITTED intake;
 * - User must exist;
 * - User email must match the candidate email;
 * - participant cannot be reassigned;
 * - User cannot already belong to another participant;
 * - replay of the exact linkage is idempotent.
 *
 * Identity linkage does not create or change:
 * - Program standing;
 * - appointment;
 * - authority;
 * - authority exercisability.
 */
export async function linkRepresentativeProgramParticipantUserWithClient(
  params: {
    client: RepresentativeProgramParticipantUserLinkClient;
    participantId: string;
    userId: string;
    actorUserId: string;
    occurredAt?: Date;
  },
) {
  const participantId =
    params.participantId.trim();

  const userId =
    params.userId.trim();

  const actorUserId =
    params.actorUserId.trim();

  if (
    !participantId ||
    !userId ||
    !actorUserId
  ) {
    throw new Error(
      "[ARP_PARTICIPANT_USER_LINK_INPUT_REQUIRED]",
    );
  }

  const occurredAt =
    params.occurredAt ?? new Date();

  if (
    !Number.isFinite(
      occurredAt.getTime(),
    )
  ) {
    throw new Error(
      "[ARP_PARTICIPANT_USER_LINK_TIME_INVALID]",
    );
  }

  const participant =
    await params.client.representativeProgramParticipant.findUnique({
      where: {
        id: participantId,
      },
      include: {
        onboardingIntake: true,
      },
    });

  if (!participant) {
    throw new Error(
      `[ARP_PARTICIPANT_USER_LINK_PARTICIPANT_NOT_FOUND] ${participantId}`,
    );
  }

  const intake =
    participant.onboardingIntake;

  if (
    !intake ||
    intake.status !== "ADMITTED" ||
    intake.admittedParticipantId !==
      participant.id
  ) {
    throw new Error(
      "[ARP_PARTICIPANT_USER_LINK_ADMISSION_REQUIRED]",
    );
  }

  const user =
    await params.client.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
      },
    });

  if (!user) {
    throw new Error(
      `[ARP_PARTICIPANT_USER_LINK_USER_NOT_FOUND] ${userId}`,
    );
  }

  if (
    normalizeEmail(user.email) !==
    normalizeEmail(
      intake.candidateEmail,
    )
  ) {
    throw new Error(
      "[ARP_PARTICIPANT_USER_LINK_EMAIL_MISMATCH]",
    );
  }

  if (
    participant.userId &&
    participant.userId !== user.id
  ) {
    throw new Error(
      "[ARP_PARTICIPANT_USER_LINK_REASSIGNMENT_FORBIDDEN]",
    );
  }

  if (
    participant.userId === user.id
  ) {
    return {
      participantId:
        participant.id,
      userId:
        user.id,
      linked:
        false,
    } as const;
  }

  const existingForUser =
    await params.client.representativeProgramParticipant.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

  if (
    existingForUser &&
    existingForUser.id !==
      participant.id
  ) {
    throw new Error(
      `[ARP_PARTICIPANT_USER_LINK_USER_ALREADY_LINKED] ${existingForUser.id}`,
    );
  }

  const updated =
    await params.client.representativeProgramParticipant.updateMany({
      where: {
        id: participant.id,
        userId: null,
      },
      data: {
        userId: user.id,
      },
    });

  if (updated.count !== 1) {
    throw new Error(
      "[ARP_PARTICIPANT_USER_LINK_CONCURRENT_CHANGE]",
    );
  }

  await params.client.domainEvent.create({
    data: {
      streamType:
        STREAM_TYPE,
      streamId:
        participant.id,
      eventType:
        EVENT_TYPE,
      eventVersion:
        1,
      payload: {
        participantId:
          participant.id,
        docketReference:
          participant.docketReference,
        userId:
          user.id,
        email:
          normalizeEmail(user.email),
      },
      metadata: {
        actorUserId,
        source:
          "representative-program.participant-user-link",
      },
      occurredAt,
    },
  });

  return {
    participantId:
      participant.id,
    userId:
      user.id,
    linked:
      true,
  } as const;
}
