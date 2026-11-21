import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
} from "../../src/domains/instruments/contracts";

import {
  REPRESENTATIVE_APPOINTMENT_CLASS,
  REPRESENTATIVE_PROGRAM_STANDING,
} from "../../src/domains/instruments/representative-program/contracts";

import { createRepresentativeProgramParticipantWithClient } from "../../src/domains/instruments/representative-program/commands/createRepresentativeProgramParticipantWithClient";

import { createRepresentativeProgramAppointmentWithClient } from "../../src/domains/instruments/representative-program/commands/createRepresentativeProgramAppointmentWithClient";

import { transitionRepresentativeProgramStandingWithClient } from "../../src/domains/instruments/representative-program/commands/transitionRepresentativeProgramStandingWithClient";

import { loadRepresentativeProgramParticipantWithClient } from "../../src/domains/instruments/representative-program/queries/loadRepresentativeProgramParticipantWithClient";

type RepresentativeProgramSmokeClient = Pick<
  PrismaClientType,
  | "user"
  | "representativeProgramDocketSequence"
  | "representativeProgramParticipant"
  | "representativeProgramStandingTransition"
  | "representativeProgramAppointment"
  | "institutionalInstrument"
  | "instrumentParty"
>;

const prisma = new PrismaClient();

const ROLLBACK = "ARP_PARTICIPANT_SMOKE_ROLLBACK";

async function main() {
  const actor = await prisma.user.findFirst({
    where: {
      isAdmin: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!actor) {
    throw new Error("[ARP_SMOKE_ADMIN_USER_REQUIRED]");
  }

  try {
    await prisma.$transaction(async (tx: RepresentativeProgramSmokeClient) => {
      const now = new Date("2026-09-20T00:00:00.000Z");

      const participant =
        await createRepresentativeProgramParticipantWithClient({
          client: tx,
          displayName: "ARP Smoke Representative",
          standing: REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
          actorUserId: actor.id,
          userId: null,
          occurredAt: now,
        });

      if (participant.userId !== null) {
        throw new Error("[ARP_SMOKE_PARTICIPANT_USER_INDEPENDENCE_FAILED]");
      }

      if (!/^FWI-26-RP-\d{3}$/.test(participant.docketReference)) {
        throw new Error(
          `[ARP_SMOKE_DOCKET_FORMAT_FAILED] ${participant.docketReference}`,
        );
      }

      if (
        participant.standing !== REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL
      ) {
        throw new Error("[ARP_SMOKE_INITIAL_STANDING_FAILED]");
      }

      if (
        participant.standingTransitions.length !== 1 ||
        participant.standingTransitions[0]?.fromStanding !== null ||
        participant.standingTransitions[0]?.toStanding !==
          REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL
      ) {
        throw new Error("[ARP_SMOKE_INITIAL_TRANSITION_FAILED]");
      }

      const instrument = await tx.institutionalInstrument.create({
        data: {
          reference: `SMOKE-${participant.docketReference}-A`,
          kind: INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT,
          title: "ARP Smoke Representative Appointment",
          status: INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT,
          currentVersion: 1,
          createdByUserId: actor.id,
        },
      });

      const appointmentResult =
        await createRepresentativeProgramAppointmentWithClient({
          client: tx,
          participantId: participant.id,
          instrumentId: instrument.id,
          appointmentClass:
            REPRESENTATIVE_APPOINTMENT_CLASS.AUTHORIZED_COMMERCIAL_REPRESENTATIVE,
          actorUserId: actor.id,
          scope: {
            smoke: true,
          },
          effectiveAt: now,
        });

      if (!appointmentResult.created) {
        throw new Error("[ARP_SMOKE_APPOINTMENT_NOT_CREATED]");
      }

      const instrumentAfterAppointment =
        await tx.institutionalInstrument.findUniqueOrThrow({
          where: {
            id: instrument.id,
          },
        });

      if (
        instrumentAfterAppointment.status !==
        INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT
      ) {
        throw new Error("[ARP_SMOKE_APPOINTMENT_MUTATED_INSTRUMENT_STATUS]");
      }

      const standingResult =
        await transitionRepresentativeProgramStandingWithClient({
          client: tx,
          participantId: participant.id,
          toStanding: REPRESENTATIVE_PROGRAM_STANDING.ACTIVE,
          actorUserId: actor.id,
          reason: "ARP participant smoke activation",
          occurredAt: new Date("2026-09-20T00:01:00.000Z"),
        });

      if (
        standingResult.participant.standing !==
        REPRESENTATIVE_PROGRAM_STANDING.ACTIVE
      ) {
        throw new Error("[ARP_SMOKE_STANDING_TRANSITION_FAILED]");
      }

      const instrumentAfterStanding =
        await tx.institutionalInstrument.findUniqueOrThrow({
          where: {
            id: instrument.id,
          },
        });

      if (
        instrumentAfterStanding.status !== INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT
      ) {
        throw new Error("[ARP_SMOKE_STANDING_MUTATED_INSTRUMENT_STATUS]");
      }

      const loaded = await loadRepresentativeProgramParticipantWithClient({
        client: tx,
        docketReference: participant.docketReference,
      });

      if (!loaded) {
        throw new Error("[ARP_SMOKE_LOAD_FAILED]");
      }

      if (loaded.appointments.length !== 1) {
        throw new Error(
          `[ARP_SMOKE_APPOINTMENT_COUNT_FAILED] ${loaded.appointments.length}`,
        );
      }

      const appointment = loaded.appointments[0];

      if (
        appointment?.appointmentClass !==
        REPRESENTATIVE_APPOINTMENT_CLASS.AUTHORIZED_COMMERCIAL_REPRESENTATIVE
      ) {
        throw new Error("[ARP_SMOKE_APPOINTMENT_CLASS_FAILED]");
      }

      if (
        appointment.instrument.kind !==
        INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT
      ) {
        throw new Error("[ARP_SMOKE_INSTRUMENT_KIND_FAILED]");
      }

      if (appointment.instrumentParty.role !== "COMMERCIAL_PARTICIPANT") {
        throw new Error("[ARP_SMOKE_INSTRUMENT_PARTY_BINDING_FAILED]");
      }

      if (loaded.standingTransitions.length !== 2) {
        throw new Error(
          `[ARP_SMOKE_STANDING_HISTORY_FAILED] ${loaded.standingTransitions.length}`,
        );
      }

      console.log("✓ participant exists independently of AXPT User");
      console.log(`✓ docket assigned: ${loaded.docketReference}`);
      console.log(`✓ standing: ${loaded.standing}`);
      console.log(`✓ appointment class: ${appointment.appointmentClass}`);
      console.log(`✓ instrument kind: ${appointment.instrument.kind}`);
      console.log(`✓ instrument party: ${appointment.instrumentParty.role}`);
      console.log(
        `✓ standing history count: ${loaded.standingTransitions.length}`,
      );
      console.log(
        "✓ Program Standing did not mutate Institutional Instrument Status",
      );

      throw new Error(ROLLBACK);
    });
  } catch (error) {
    if (error instanceof Error && error.message === ROLLBACK) {
      console.log("✓ smoke transaction rolled back");
      return;
    }

    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
