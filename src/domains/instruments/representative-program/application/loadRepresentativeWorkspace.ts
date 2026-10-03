import { prisma } from "@/infrastructure/db/prisma";

export type RepresentativeWorkspaceRecord = {
  participantId: string;
  docketReference: string;
  displayName: string;
  standing:
    | "PROVISIONAL"
    | "ACTIVE"
    | "RESTRICTED"
    | "SUSPENDED"
    | "EXPIRED"
    | "WITHDRAWN"
    | "REVOKED";
  admittedAt: Date | null;
  intakeReference: string | null;
  appointment: {
    id: string;
    appointmentClass: string;
    effectiveAt: Date | null;
    expiresAt: Date | null;
    endedAt: Date | null;
    instrument: {
      id: string;
      reference: string;
      title: string;
      status: string;
    };
  } | null;
};

export async function loadRepresentativeWorkspace(
  userId: string,
): Promise<RepresentativeWorkspaceRecord | null> {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new Error(
      "REPRESENTATIVE_WORKSPACE_USER_REQUIRED",
    );
  }

  const participants =
    await prisma.representativeProgramParticipant.findMany({
      where: {
        userId: normalizedUserId,
      },
      select: {
        id: true,
        docketReference: true,
        displayName: true,
        standing: true,
        admittedAt: true,
        onboardingIntake: {
          select: {
            reference: true,
          },
        },
        appointments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            appointmentClass: true,
            effectiveAt: true,
            expiresAt: true,
            endedAt: true,
            instrument: {
              select: {
                id: true,
                reference: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

  if (participants.length === 0) {
    return null;
  }

  if (participants.length !== 1) {
    throw new Error(
      `[REPRESENTATIVE_WORKSPACE_PARTICIPANT_CONTRADICTION] userId=${normalizedUserId} count=${participants.length}`,
    );
  }

  const participant = participants[0];
  const appointment =
    participant.appointments[0] ?? null;

  return {
    participantId: participant.id,
    docketReference:
      participant.docketReference,
    displayName:
      participant.displayName,
    standing:
      participant.standing,
    admittedAt:
      participant.admittedAt,
    intakeReference:
      participant.onboardingIntake
        ?.reference ?? null,
    appointment:
      appointment
        ? {
            id: appointment.id,
            appointmentClass:
              appointment.appointmentClass,
            effectiveAt:
              appointment.effectiveAt,
            expiresAt:
              appointment.expiresAt,
            endedAt:
              appointment.endedAt,
            instrument: {
              id: appointment.instrument.id,
              reference:
                appointment.instrument.reference,
              title:
                appointment.instrument.title,
              status:
                appointment.instrument.status,
            },
          }
        : null,
  };
}
