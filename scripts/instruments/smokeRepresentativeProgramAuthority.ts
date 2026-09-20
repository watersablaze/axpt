import assert from "node:assert/strict";

import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_AUTHORITY_CLASS,
} from "../../src/domains/instruments/contracts";

import {
  REPRESENTATIVE_APPOINTMENT_CLASS,
  REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON,
  REPRESENTATIVE_AUTHORITY_KEY,
  REPRESENTATIVE_PROGRAM_STANDING,
} from "../../src/domains/instruments/representative-program/contracts";

import { createRepresentativeProgramParticipantWithClient } from "../../src/domains/instruments/representative-program/commands/createRepresentativeProgramParticipantWithClient";

import { createRepresentativeProgramAppointmentWithClient } from "../../src/domains/instruments/representative-program/commands/createRepresentativeProgramAppointmentWithClient";

import { recordRepresentativeProgramAuthorityWithClient } from "../../src/domains/instruments/representative-program/commands/recordRepresentativeProgramAuthorityWithClient";

import { transitionRepresentativeProgramStandingWithClient } from "../../src/domains/instruments/representative-program/commands/transitionRepresentativeProgramStandingWithClient";

import { resolveRepresentativeProgramAuthorityExercisabilityWithClient } from "../../src/domains/instruments/representative-program/queries/resolveRepresentativeProgramAuthorityExercisabilityWithClient";

type RepresentativeAuthoritySmokeClient = Pick<
  PrismaClientType,
  | "user"
  | "representativeProgramDocketSequence"
  | "representativeProgramParticipant"
  | "representativeProgramStandingTransition"
  | "representativeProgramAppointment"
  | "institutionalInstrument"
  | "instrumentParty"
  | "instrumentAuthority"
  | "domainEvent"
>;

const prisma = new PrismaClient();

const ROLLBACK = "ARP_2C_AUTHORITY_SMOKE_ROLLBACK";

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
    throw new Error("[ARP_2C_SMOKE_ADMIN_USER_REQUIRED]");
  }

  let smokeInstrumentId: string | null = null;

  try {
    await prisma.$transaction(
      async (tx: RepresentativeAuthoritySmokeClient) => {
        const now = new Date("2026-09-20T12:00:00.000Z");

        const participant =
          await createRepresentativeProgramParticipantWithClient({
            client: tx,
            displayName: "ARP-2C Authority Smoke Representative",
            standing: REPRESENTATIVE_PROGRAM_STANDING.ACTIVE,
            actorUserId: actor.id,
            userId: null,
            occurredAt: now,
          });

        const instrument = await tx.institutionalInstrument.create({
          data: {
            reference: `SMOKE-${participant.docketReference}-AUTH`,
            kind: INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT,
            title: "ARP-2C Authority Smoke Appointment",
            status: INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT,
            currentVersion: 1,
            createdByUserId: actor.id,
          },
        });

        smokeInstrumentId = instrument.id;

        const appointmentResult =
          await createRepresentativeProgramAppointmentWithClient({
            client: tx,
            participantId: participant.id,
            instrumentId: instrument.id,
            appointmentClass:
              REPRESENTATIVE_APPOINTMENT_CLASS.AUTHORIZED_COMMERCIAL_REPRESENTATIVE,
            actorUserId: actor.id,
            effectiveAt: now,
            expiresAt: new Date("2026-12-31T23:59:59.000Z"),
          });

        const appointment = appointmentResult.appointment;

        const presentation =
          await recordRepresentativeProgramAuthorityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION,
            authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
            action:
              "Present current French-Ward commercial materials without alteration.",
            actorUserId: actor.id,
            effectiveAt: now,
          });

        assert.equal(presentation.created, true);

        assert.equal(
          presentation.authority.holderPartyId,
          appointment.instrumentPartyId,
        );

        const presentationResolution =
          await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION,
            at: new Date("2026-09-20T12:01:00.000Z"),
          });

        assert.equal(presentationResolution.exercisable, true);

        assert.equal(
          presentationResolution.reason,
          REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.EXERCISABLE,
        );

        console.log(
          "✓ delegated presentation authority exercisable while ACTIVE",
        );

        const duplicate = await recordRepresentativeProgramAuthorityWithClient({
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION,
          authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
          action:
            "Present current French-Ward commercial materials without alteration.",
          actorUserId: actor.id,
          effectiveAt: new Date("2026-09-20T12:02:00.000Z"),
        });

        assert.equal(duplicate.created, false);

        assert.equal(duplicate.authority.id, presentation.authority.id);

        console.log("✓ exact active authority disposition is idempotent");

        await assert.rejects(
          () =>
            recordRepresentativeProgramAuthorityWithClient({
              client: tx,
              appointmentId: appointment.id,
              authorityKey: REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION,
              authorityClass: INSTRUMENT_AUTHORITY_CLASS.PROHIBITED,
              action: "Present French-Ward commercial materials.",
              actorUserId: actor.id,
              effectiveAt: new Date("2026-09-20T12:03:00.000Z"),
            }),
          /ARP_AUTHORITY_SLOT_OCCUPIED/,
        );

        console.log("✓ contradictory active disposition rejected");

        const negotiation =
          await recordRepresentativeProgramAuthorityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
            authorityClass: INSTRUMENT_AUTHORITY_CLASS.JOINT,
            action:
              "Negotiate transaction terms only with required French-Ward approval.",
            conditions: {
              requiresPriorApproval: true,
              approvalAuthority: "TRANSACTION_AUTHORITY",
            },
            actorUserId: actor.id,
            effectiveAt: now,
          });

        assert.equal(
          negotiation.authority.holderPartyId,
          appointment.instrumentPartyId,
        );

        const negotiationResolution =
          await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
            at: new Date("2026-09-20T12:04:00.000Z"),
          });

        assert.equal(negotiationResolution.exercisable, false);

        assert.equal(
          negotiationResolution.reason,
          REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.JOINT_AUTHORITY_REQUIRES_COORDINATION,
        );

        console.log("✓ joint negotiation authority requires coordination");

        const binding = await recordRepresentativeProgramAuthorityWithClient({
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.BINDING_AUTHORITY,
          authorityClass: INSTRUMENT_AUTHORITY_CLASS.RESERVED,
          action: "Execute, sign, accept, or otherwise bind French-Ward.",
          actorUserId: actor.id,
          effectiveAt: now,
        });

        assert.equal(binding.authority.holderPartyId, null);

        const bindingResolution =
          await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.BINDING_AUTHORITY,
            at: new Date("2026-09-20T12:05:00.000Z"),
          });

        assert.equal(bindingResolution.exercisable, false);

        assert.equal(
          bindingResolution.reason,
          REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.AUTHORITY_RESERVED,
        );

        console.log(
          "✓ reserved binding authority is not held by representative",
        );

        await transitionRepresentativeProgramStandingWithClient({
          client: tx,
          participantId: participant.id,
          toStanding: REPRESENTATIVE_PROGRAM_STANDING.SUSPENDED,
          actorUserId: actor.id,
          reason: "ARP-2C exercisability smoke",
          occurredAt: new Date("2026-09-20T12:06:00.000Z"),
        });

        const suspendedPresentation =
          await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION,
            at: new Date("2026-09-20T12:07:00.000Z"),
          });

        assert.equal(suspendedPresentation.exercisable, false);

        assert.equal(
          suspendedPresentation.reason,
          REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.PARTICIPANT_SUSPENDED,
        );

        assert.equal(suspendedPresentation.authority?.revokedAt, null);

        console.log(
          "✓ suspension disables exercise without revoking authority",
        );

        const authorityCount = await tx.instrumentAuthority.count({
          where: {
            instrumentId: instrument.id,
          },
        });

        assert.equal(authorityCount, 3);

        console.log("✓ three canonical authority slots recorded");

        throw new Error(ROLLBACK);
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === ROLLBACK) {
      console.log("✓ authority smoke transaction rolled back");
    } else {
      throw error;
    }
  }

  if (!smokeInstrumentId) {
    throw new Error("[ARP_2C_SMOKE_INSTRUMENT_ID_NOT_CAPTURED]");
  }

  const [
    survivingParticipant,
    survivingInstrument,
    survivingAuthorities,
    survivingEvents,
  ] = await Promise.all([
    prisma.representativeProgramParticipant.count({
      where: {
        displayName: "ARP-2C Authority Smoke Representative",
      },
    }),
    prisma.institutionalInstrument.count({
      where: {
        id: smokeInstrumentId,
      },
    }),
    prisma.instrumentAuthority.count({
      where: {
        instrumentId: smokeInstrumentId,
      },
    }),
    prisma.domainEvent.count({
      where: {
        streamId: smokeInstrumentId,
      },
    }),
  ]);

  if (
    survivingParticipant !== 0 ||
    survivingInstrument !== 0 ||
    survivingAuthorities !== 0 ||
    survivingEvents !== 0
  ) {
    throw new Error(
      `[ARP_2C_SMOKE_ROLLBACK_INCOMPLETE] participant=${survivingParticipant} instrument=${survivingInstrument} authorities=${survivingAuthorities} events=${survivingEvents}`,
    );
  }

  console.log("✓ participant rolled back");
  console.log("✓ appointment instrument rolled back");
  console.log("✓ authority records rolled back");
  console.log("✓ authority events rolled back");
  console.log("ARP_2C_AUTHORITY_LAYER_OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
