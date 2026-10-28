import "server-only";

import type { PrismaClient } from "@prisma/client";

import {
  globalMotherCycleV2Plan as plan,
} from "../definitions/globalMotherCycleV2Plan";

import {
  resolveGlobalMotherChamberV2PersistedPosture,
  type PersistedPosture,
} from "./resolveGlobalMotherChamberV2PersistedPosture";

type ReadClient = Pick<
  PrismaClient,
  | "globalMotherChamberAdmission"
  | "globalMotherChamberRoomBinding"
  | "communicationOperationalRoom"
  | "user"
>;

export async function loadGlobalMotherChamberV2PersistedPostureWithClient(
  client: ReadClient,
): Promise<PersistedPosture[]> {
  const [admissions, bindings, rooms] = await Promise.all([
    client.globalMotherChamberAdmission.findMany({
      where: {
        instrumentReference: plan.instrumentReference,
        cycleLabel: plan.cycleLabel,
      },
    }),

    client.globalMotherChamberRoomBinding.findMany({
      where: {
        instrumentReference: plan.instrumentReference,
        cycleLabel: plan.cycleLabel,
      },
    }),

    client.communicationOperationalRoom.findMany({
      where: {
        clientRoomId: plan.communications.clientRoomId,
      },
      select: {
        id: true,
        clientRoomId: true,
        roomClass: true,
      },
    }),
  ]);

  const userIds = [
    ...new Set(
      admissions
        .map((admission: { participantUserId: string | null }) => admission.participantUserId)
        .filter((id: string | null): id is string => Boolean(id)),
    ),
  ];

  const users = userIds.length
    ? await client.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: { id: true },
      })
    : [];

  const knownUsers = new Set(users.map((user: { id: string }) => user.id));

  return plan.participants.map((participant) =>
    resolveGlobalMotherChamberV2PersistedPosture({
      participantKey: participant.key,
      admissions: admissions.filter(
        (admission: { participantKey: string }) =>
          admission.participantKey === participant.key,
      ),
      bindings,
      rooms,
      linkedUserExists: admissions.some(
        (admission: { participantKey: string; participantUserId: string | null }) =>
          admission.participantKey === participant.key &&
          Boolean(
            admission.participantUserId &&
            knownUsers.has(admission.participantUserId),
          ),
      ),
    }),
  );
}
