import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTRUMENT_PARTY_ROLE,
} from "../../contracts";

import type {
  RepresentativeAppointmentClass,
} from "../contracts";

export type RepresentativeProgramAppointmentCreationClient = Pick<
  PrismaClient,
  | "representativeProgramParticipant"
  | "representativeProgramAppointment"
  | "institutionalInstrument"
  | "instrumentParty"
>;

export async function createRepresentativeProgramAppointmentWithClient(params: {
  client: RepresentativeProgramAppointmentCreationClient;
  participantId: string;
  instrumentId: string;
  appointmentClass: RepresentativeAppointmentClass;
  actorUserId: string;
  scope?: Readonly<Record<string, unknown>> | null;
  effectiveAt?: Date | null;
  expiresAt?: Date | null;
}) {
  const participant =
    await params.client.representativeProgramParticipant.findUnique({
      where: {
        id: params.participantId,
      },
    });

  if (!participant) {
    throw new Error(
      `[ARP_APPOINTMENT_PARTICIPANT_NOT_FOUND] ${params.participantId}`,
    );
  }

  const instrument =
    await params.client.institutionalInstrument.findUnique({
      where: {
        id: params.instrumentId,
      },
      include: {
        parties: true,
      },
    });

  if (!instrument) {
    throw new Error(
      `[ARP_APPOINTMENT_INSTRUMENT_NOT_FOUND] ${params.instrumentId}`,
    );
  }

  if (
    instrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT
  ) {
    throw new Error(
      `[ARP_APPOINTMENT_WRONG_INSTRUMENT_KIND] expected=${INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT} actual=${instrument.kind}`,
    );
  }

  const existing =
    await params.client.representativeProgramAppointment.findUnique({
      where: {
        instrumentId: instrument.id,
      },
    });

  if (existing) {
    if (
      existing.participantId !== participant.id ||
      existing.appointmentClass !== params.appointmentClass
    ) {
      throw new Error(
        `[ARP_APPOINTMENT_INSTRUMENT_ALREADY_BOUND] ${instrument.id}`,
      );
    }

    return {
      appointment: existing,
      created: false,
    } as const;
  }

  let instrumentParty = instrument.parties.find(
    (party: {
      id: string;
      userId: string | null;
      displayName: string;
      role: string;
    }) =>
      participant.userId
        ? party.userId === participant.userId
        : party.userId === null &&
          party.displayName === participant.displayName &&
          party.role === INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
  );

  if (!instrumentParty) {
    instrumentParty = await params.client.instrumentParty.create({
      data: {
        instrumentId: instrument.id,
        userId: participant.userId,
        displayName: participant.displayName,
        role: INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
      },
    });
  }

  const appointment =
    await params.client.representativeProgramAppointment.create({
      data: {
        participantId: participant.id,
        instrumentId: instrument.id,
        instrumentPartyId: instrumentParty.id,
        appointmentClass: params.appointmentClass,
        scope: params.scope ?? undefined,
        effectiveAt: params.effectiveAt ?? null,
        expiresAt: params.expiresAt ?? null,
        createdByUserId: params.actorUserId,
      },
    });

  return {
    appointment,
    created: true,
  } as const;
}
