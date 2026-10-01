import type { PrismaClient } from "@prisma/client";

export type RepresentativeProgramParticipantReadClient = Pick<
  PrismaClient,
  "representativeProgramParticipant"
>;

export async function loadRepresentativeProgramParticipantWithClient(params: {
  client: RepresentativeProgramParticipantReadClient;
  participantId?: string;
  docketReference?: string;
}) {
  if (!params.participantId && !params.docketReference) {
    throw new Error("[ARP_PARTICIPANT_LOOKUP_KEY_REQUIRED]");
  }

  return params.client.representativeProgramParticipant.findUnique({
    where: params.participantId
      ? {
          id: params.participantId,
        }
      : {
          docketReference: params.docketReference!,
        },
    include: {
      user: true,
      standingTransitions: {
        orderBy: {
          occurredAt: "asc",
        },
      },
      appointments: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          instrument: true,
          instrumentParty: true,
        },
      },
    },
  });
}
