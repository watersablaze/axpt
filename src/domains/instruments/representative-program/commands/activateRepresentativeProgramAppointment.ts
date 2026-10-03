import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
} from "../../contracts";

import { transitionInstrumentStateWithClient } from "../../commands/transitionInstrumentStateWithClient";

import {
  REPRESENTATIVE_PROGRAM_STANDING,
} from "../contracts";

import { REPRESENTATIVE_ONBOARDING_STATUS } from "../onboarding/contracts";

import { transitionRepresentativeProgramStandingWithClient } from "./transitionRepresentativeProgramStandingWithClient";

export type RepresentativeProgramAppointmentActivationClient = Pick<
  PrismaClient,
  | "user"
  | "representativeProgramParticipant"
  | "representativeProgramAppointment"
  | "representativeProgramStandingTransition"
  | "institutionalInstrument"
  | "instrumentAuthority"
  | "instrumentStateTransition"
  | "domainEvent"
>;

type Runner = Pick<PrismaClient, "$transaction">;

/**
 * APPT-2
 *
 * Activate a prepared Representative Program Appointment.
 *
 * PREPARED ≠ ACTIVE.
 * AUTHORITY RECORDED ≠ AUTHORITY EXERCISABLE.
 *
 * Activation requires:
 * - an admitted Program Participant;
 * - a bound EXECUTED Program Master Agreement;
 * - PROVISIONAL Participant standing;
 * - a DRAFT Appointment Instrument;
 * - an Appointment with no prior effectiveAt or endedAt.
 *
 * Atomically:
 * - transitions the Appointment Instrument DRAFT -> ACTIVE;
 * - establishes Appointment effectiveAt;
 * - transitions Participant standing PROVISIONAL -> ACTIVE.
 *
 * This operation creates no authority and changes no authority disposition.
 */
export async function activateRepresentativeProgramAppointmentWithClient(
  params: {
    client: RepresentativeProgramAppointmentActivationClient;
    appointmentId: string;
    actorUserId: string;
    occurredAt?: Date;
  },
) {
  const appointmentId = params.appointmentId.trim();
  const actorUserId = params.actorUserId.trim();
  const occurredAt = params.occurredAt ?? new Date();

  if (
    !appointmentId ||
    !actorUserId ||
    !Number.isFinite(occurredAt.getTime())
  ) {
    throw new Error("[ARP_APPOINTMENT_ACTIVATION_INPUT_INVALID]");
  }

  const actor = await params.client.user.findUnique({
    where: {
      id: actorUserId,
    },
    select: {
      isAdmin: true,
    },
  });

  if (!actor?.isAdmin) {
    throw new Error("[ARP_APPOINTMENT_ACTIVATION_ADMIN_REQUIRED]");
  }

  const appointment =
    await params.client.representativeProgramAppointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        instrument: true,
        participant: {
          include: {
            onboardingIntake: {
              include: {
                masterAgreementInstrument: true,
              },
            },
          },
        },
      },
    });

  if (!appointment) {
    throw new Error(
      `[ARP_APPOINTMENT_ACTIVATION_APPOINTMENT_NOT_FOUND] ${appointmentId}`,
    );
  }

  if (
    appointment.instrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT
  ) {
    throw new Error(
      `[ARP_APPOINTMENT_ACTIVATION_INSTRUMENT_KIND_INVALID] ${appointment.instrument.kind}`,
    );
  }

  const participant = appointment.participant;
  const intake = participant.onboardingIntake;

  if (
    !intake ||
    intake.status !== REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED ||
    intake.admittedParticipantId !== participant.id ||
    !intake.masterAgreementInstrumentId ||
    !intake.masterAgreementInstrument
  ) {
    throw new Error(
      "[ARP_APPOINTMENT_ACTIVATION_ADMISSION_BINDING_REQUIRED]",
    );
  }

  if (
    intake.masterAgreementInstrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_PROGRAM_AGREEMENT
  ) {
    throw new Error(
      "[ARP_APPOINTMENT_ACTIVATION_MASTER_AGREEMENT_KIND_INVALID]",
    );
  }

  if (
    intake.masterAgreementInstrument.status !==
    INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTED
  ) {
    throw new Error(
      `[ARP_APPOINTMENT_ACTIVATION_MASTER_AGREEMENT_NOT_EXECUTED] ${intake.masterAgreementInstrument.status}`,
    );
  }

  /*
   * Idempotent convergence.
   *
   * A completely activated appointment is a successful replay.
   * Partial / contradictory activation state is never silently repaired.
   */
  if (
    appointment.instrument.status ===
      INSTITUTIONAL_INSTRUMENT_STATUS.ACTIVE &&
    appointment.effectiveAt !== null &&
    appointment.endedAt === null &&
    participant.standing === REPRESENTATIVE_PROGRAM_STANDING.ACTIVE
  ) {
    return {
      appointmentId: appointment.id,
      participantId: participant.id,
      instrumentId: appointment.instrument.id,
      instrumentReference: appointment.instrument.reference,
      effectiveAt: appointment.effectiveAt,
      participantStanding: participant.standing,
      activated: false,
    } as const;
  }

  if (
    participant.standing !== REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL
  ) {
    throw new Error(
      `[ARP_APPOINTMENT_ACTIVATION_PARTICIPANT_NOT_PROVISIONAL] ${participant.standing}`,
    );
  }

  if (
    appointment.instrument.status !==
    INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT
  ) {
    throw new Error(
      `[ARP_APPOINTMENT_ACTIVATION_INSTRUMENT_NOT_DRAFT] ${appointment.instrument.status}`,
    );
  }

  if (appointment.effectiveAt !== null) {
    throw new Error(
      "[ARP_APPOINTMENT_ACTIVATION_ALREADY_EFFECTIVE]",
    );
  }

  if (appointment.endedAt !== null) {
    throw new Error(
      "[ARP_APPOINTMENT_ACTIVATION_APPOINTMENT_ENDED]",
    );
  }

  await transitionInstrumentStateWithClient({
    client: params.client,
    instrumentReference: appointment.instrument.reference,
    expectedFromStatus: INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT,
    toStatus: INSTITUTIONAL_INSTRUMENT_STATUS.ACTIVE,
    actorUserId,
    reason: "Representative Program Appointment activated",
    metadata: {
      appointmentId: appointment.id,
      participantId: participant.id,
      masterAgreementInstrumentId:
        intake.masterAgreementInstrument.id,
      masterAgreementReference:
        intake.masterAgreementInstrument.reference,
    },
    occurredAt,
  });

  const appointmentUpdate =
    await params.client.representativeProgramAppointment.updateMany({
      where: {
        id: appointment.id,
        effectiveAt: null,
        endedAt: null,
      },
      data: {
        effectiveAt: occurredAt,
      },
    });

  if (appointmentUpdate.count !== 1) {
    throw new Error(
      "[ARP_APPOINTMENT_ACTIVATION_CONCURRENT_APPOINTMENT_CHANGE]",
    );
  }

  const standing =
    await transitionRepresentativeProgramStandingWithClient({
      client: params.client,
      participantId: participant.id,
      toStanding: REPRESENTATIVE_PROGRAM_STANDING.ACTIVE,
      actorUserId,
      reason: "Representative Program Appointment activated",
      metadata: {
        appointmentId: appointment.id,
        instrumentId: appointment.instrument.id,
        instrumentReference: appointment.instrument.reference,
      },
      occurredAt,
    });

  return {
    appointmentId: appointment.id,
    participantId: participant.id,
    instrumentId: appointment.instrument.id,
    instrumentReference: appointment.instrument.reference,
    effectiveAt: occurredAt,
    participantStanding: standing.participant.standing,
    activated: true,
  } as const;
}

export async function activateRepresentativeProgramAppointment(
  params: Omit<
    Parameters<
      typeof activateRepresentativeProgramAppointmentWithClient
    >[0],
    "client"
  > & {
    client: Runner;
  },
) {
  return params.client.$transaction(
    (
      tx: RepresentativeProgramAppointmentActivationClient,
    ) =>
      activateRepresentativeProgramAppointmentWithClient({
        ...params,
        client: tx,
      }),
    {
      maxWait: 10_000,
      timeout: 30_000,
    },
  );
}
