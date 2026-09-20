import assert from "node:assert/strict";

import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_AUTHORITY_CLASS,
  INSTRUMENT_PARTY_ROLE,
} from "../../src/domains/instruments/contracts";

import {
  REPRESENTATIVE_APPOINTMENT_CLASS,
  REPRESENTATIVE_AUTHORITY_KEY,
  REPRESENTATIVE_PROGRAM_STANDING,
} from "../../src/domains/instruments/representative-program/contracts";

import { recordInstrumentAuthorityWithClient } from "../../src/domains/instruments/commands/recordInstrumentAuthorityWithClient";

import { createRepresentativeProgramParticipantWithClient } from "../../src/domains/instruments/representative-program/commands/createRepresentativeProgramParticipantWithClient";

import { createRepresentativeProgramAppointmentWithClient } from "../../src/domains/instruments/representative-program/commands/createRepresentativeProgramAppointmentWithClient";

import { recordRepresentativeProgramAuthorityWithClient } from "../../src/domains/instruments/representative-program/commands/recordRepresentativeProgramAuthorityWithClient";

import { revokeRepresentativeProgramAuthorityWithClient } from "../../src/domains/instruments/representative-program/commands/revokeRepresentativeProgramAuthorityWithClient";

import { replaceRepresentativeProgramAuthorityWithClient } from "../../src/domains/instruments/representative-program/commands/replaceRepresentativeProgramAuthority";

import { resolveRepresentativeProgramAuthorityExercisabilityWithClient } from "../../src/domains/instruments/representative-program/queries/resolveRepresentativeProgramAuthorityExercisabilityWithClient";

type SmokeClient = Pick<
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

const ROLLBACK = "ARP_2D_AUTHORITY_INTEGRITY_SMOKE_ROLLBACK";

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
    throw new Error("[ARP_2D_SMOKE_ADMIN_USER_REQUIRED]");
  }

  const baseline = {
    participants: await prisma.representativeProgramParticipant.count(),
    appointments: await prisma.representativeProgramAppointment.count(),
    standingTransitions:
      await prisma.representativeProgramStandingTransition.count(),
    docketSequences: await prisma.representativeProgramDocketSequence.count(),
    authorities: await prisma.instrumentAuthority.count(),
  };

  assert.deepEqual(baseline, {
    participants: 0,
    appointments: 0,
    standingTransitions: 0,
    docketSequences: 0,
    authorities: 0,
  });

  let instrumentId: string | null = null;

  try {
    await prisma.$transaction(async (tx: SmokeClient) => {
      const appointmentStart = new Date("2026-09-20T12:00:00.000Z");

      const appointmentEnd = new Date("2026-12-31T23:59:59.000Z");

      const participant =
        await createRepresentativeProgramParticipantWithClient({
          client: tx,
          displayName: "ARP-2D Authority Integrity Smoke",
          standing: REPRESENTATIVE_PROGRAM_STANDING.ACTIVE,
          actorUserId: actor.id,
          userId: null,
          occurredAt: appointmentStart,
        });

      assert.equal(participant.docketReference, "FWI-26-RP-001");

      const instrument = await tx.institutionalInstrument.create({
        data: {
          reference: `SMOKE-${participant.docketReference}-INTEGRITY`,
          kind: INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT,
          title: "ARP-2D Authority Integrity Smoke Appointment",
          status: INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT,
          currentVersion: 1,
          createdByUserId: actor.id,
        },
      });

      instrumentId = instrument.id;

      const appointmentResult =
        await createRepresentativeProgramAppointmentWithClient({
          client: tx,
          participantId: participant.id,
          instrumentId: instrument.id,
          appointmentClass:
            REPRESENTATIVE_APPOINTMENT_CLASS.AUTHORIZED_COMMERCIAL_REPRESENTATIVE,
          actorUserId: actor.id,
          effectiveAt: appointmentStart,
          expiresAt: appointmentEnd,
        });

      const appointment = appointmentResult.appointment;

      /*
       * CONDITION INTEGRITY
       */

      await assert.rejects(
        () =>
          recordRepresentativeProgramAuthorityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.ACCESS,
            authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
            action: "Access authorized French-Ward commercial environments.",
            conditions: [] as never,
            actorUserId: actor.id,
            effectiveAt: new Date("2026-09-20T12:05:00.000Z"),
          }),
        /ARP_AUTHORITY_CONDITIONS_OBJECT_REQUIRED/,
      );

      console.log("✓ malformed non-object conditions rejected");

      await assert.rejects(
        () =>
          recordRepresentativeProgramAuthorityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.ACCESS,
            authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
            action: "Access authorized French-Ward commercial environments.",
            conditions: {
              unsupportedAuthorityCondition: true,
            } as never,
            actorUserId: actor.id,
            effectiveAt: new Date("2026-09-20T12:05:00.000Z"),
          }),
        /ARP_AUTHORITY_CONDITION_UNKNOWN_FIELD/,
      );

      console.log("✓ unknown condition field rejected");

      await assert.rejects(
        () =>
          recordRepresentativeProgramAuthorityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.ACCESS,
            authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
            action: "Access authorized French-Ward commercial environments.",
            conditions: {
              approvalAuthority: "TRANSACTION_AUTHORITY",
            },
            actorUserId: actor.id,
            effectiveAt: new Date("2026-09-20T12:05:00.000Z"),
          }),
        /ARP_AUTHORITY_APPROVAL_AUTHORITY_WITHOUT_REQUIREMENT/,
      );

      console.log(
        "✓ approval authority without explicit prior-approval requirement rejected",
      );

      /*
       * INTERVAL INTEGRITY
       */

      const coordinationStart = new Date("2026-10-01T10:00:00.000Z");

      const coordinationEnd = new Date("2026-10-01T12:00:00.000Z");

      const coordination = await recordRepresentativeProgramAuthorityWithClient(
        {
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.COORDINATION,
          authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
          action: "Coordinate approved transaction logistics.",
          actorUserId: actor.id,
          effectiveAt: coordinationStart,
          expiresAt: coordinationEnd,
        },
      );

      assert.equal(coordination.created, true);

      await assert.rejects(
        () =>
          recordRepresentativeProgramAuthorityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.COORDINATION,
            authorityClass: INSTRUMENT_AUTHORITY_CLASS.PROHIBITED,
            action: "Coordinate transaction logistics.",
            actorUserId: actor.id,
            effectiveAt: new Date("2026-10-01T11:00:00.000Z"),
            expiresAt: new Date("2026-10-01T13:00:00.000Z"),
          }),
        /ARP_AUTHORITY_SLOT_OCCUPIED/,
      );

      console.log("✓ overlapping future authority interval rejected");

      const presentationStart = new Date("2026-10-02T10:00:00.000Z");

      const presentationEnd = new Date("2026-10-02T12:00:00.000Z");

      const presentation = await recordRepresentativeProgramAuthorityWithClient(
        {
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION,
          authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
          action: "Present approved French-Ward commercial materials.",
          actorUserId: actor.id,
          effectiveAt: presentationStart,
          expiresAt: presentationEnd,
        },
      );

      assert.equal(presentation.created, true);

      await assert.rejects(
        () =>
          recordRepresentativeProgramAuthorityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION,
            authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
            action: "Present approved French-Ward commercial materials.",
            actorUserId: actor.id,
            effectiveAt: new Date("2026-10-02T10:30:00.000Z"),
            expiresAt: presentationEnd,
          }),
        /ARP_AUTHORITY_SLOT_OCCUPIED/,
      );

      console.log(
        "✓ same disposition with different effectiveAt is not idempotent",
      );

      const introductionA =
        await recordRepresentativeProgramAuthorityWithClient({
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.INTRODUCTION,
          authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
          action: "Introduce approved counterparties.",
          actorUserId: actor.id,
          effectiveAt: new Date("2026-10-03T10:00:00.000Z"),
          expiresAt: new Date("2026-10-03T11:00:00.000Z"),
        });

      const introductionB =
        await recordRepresentativeProgramAuthorityWithClient({
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.INTRODUCTION,
          authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
          action: "Introduce approved counterparties.",
          actorUserId: actor.id,
          effectiveAt: new Date("2026-10-03T11:00:00.000Z"),
          expiresAt: new Date("2026-10-03T12:00:00.000Z"),
        });

      assert.equal(introductionA.created, true);

      assert.equal(introductionB.created, true);

      assert.notEqual(introductionA.authority.id, introductionB.authority.id);

      const introductionAtBoundary =
        await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.INTRODUCTION,
          at: new Date("2026-10-03T11:00:00.000Z"),
        });

      assert.equal(
        introductionAtBoundary.authority?.id,
        introductionB.authority.id,
      );

      assert.equal(introductionAtBoundary.exercisable, true);

      console.log("✓ adjacent half-open authority intervals do not conflict");

      /*
       * HOLDER INTEGRITY
       */

      const foreignParty = await tx.instrumentParty.create({
        data: {
          instrumentId: instrument.id,
          userId: null,
          displayName: "ARP-2D Foreign Holder Fixture",
          role: INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
        },
      });

      assert.notEqual(foreignParty.id, appointment.instrumentPartyId);

      const foreignAuthority = await recordInstrumentAuthorityWithClient({
        client: tx,
        instrumentReference: instrument.reference,
        authorityKey: REPRESENTATIVE_AUTHORITY_KEY.COMMUNICATION,
        title: "Communication Authority",
        authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
        holderPartyId: foreignParty.id,
        action: "Communicate approved French-Ward information.",
        effectiveAt: new Date("2026-09-20T12:30:00.000Z"),
        actorUserId: actor.id,
      });

      assert.equal(foreignAuthority.created, true);

      assert.equal(foreignAuthority.authority.holderPartyId, foreignParty.id);

      await assert.rejects(
        () =>
          resolveRepresentativeProgramAuthorityExercisabilityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.COMMUNICATION,
            at: new Date("2026-09-20T12:31:00.000Z"),
          }),
        /ARP_AUTHORITY_HOLDER_INTEGRITY_VIOLATION/,
      );

      console.log("✓ same-instrument foreign holder rejected by ARP resolver");

      /*
       * REVOCATION / REPLACEMENT TIME INTEGRITY
       */

      const documentary = await recordRepresentativeProgramAuthorityWithClient({
        client: tx,
        appointmentId: appointment.id,
        authorityKey: REPRESENTATIVE_AUTHORITY_KEY.DOCUMENTARY_AUTHORITY,
        authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
        action: "Present approved documentary materials.",
        actorUserId: actor.id,
        effectiveAt: new Date("2026-09-20T12:40:00.000Z"),
      });

      assert.equal(documentary.created, true);

      const futureTime = new Date(Date.now() + 86_400_000);

      await assert.rejects(
        () =>
          revokeRepresentativeProgramAuthorityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.DOCUMENTARY_AUTHORITY,
            revokedByUserId: actor.id,
            revokedAt: futureTime,
          }),
        /ARP_AUTHORITY_FUTURE_REVOCATION_NOT_SUPPORTED/,
      );

      console.log("✓ future authority revocation rejected");

      const afterRejectedRevocation = await tx.instrumentAuthority.findUnique({
        where: {
          id: documentary.authority.id,
        },
      });

      assert.ok(afterRejectedRevocation);

      assert.equal(afterRejectedRevocation.revokedAt, null);

      await assert.rejects(
        () =>
          replaceRepresentativeProgramAuthorityWithClient({
            client: tx,
            appointmentId: appointment.id,
            authorityKey: REPRESENTATIVE_AUTHORITY_KEY.DOCUMENTARY_AUTHORITY,
            authorityClass: INSTRUMENT_AUTHORITY_CLASS.PROHIBITED,
            action: "Present documentary materials.",
            actorUserId: actor.id,
            replacedAt: futureTime,
          }),
        /ARP_AUTHORITY_FUTURE_REPLACEMENT_NOT_SUPPORTED/,
      );

      console.log("✓ future low-level authority replacement rejected");

      const afterRejectedReplacement = await tx.instrumentAuthority.findUnique({
        where: {
          id: documentary.authority.id,
        },
      });

      assert.ok(afterRejectedReplacement);

      assert.equal(afterRejectedReplacement.revokedAt, null);

      /*
       * FIXTURE COUNT / ROLLBACK
       */

      const authorityCount = await tx.instrumentAuthority.count({
        where: {
          instrumentId: instrument.id,
        },
      });

      assert.equal(authorityCount, 6);

      console.log(
        "✓ adversarial failures introduced no unintended authority rows",
      );

      throw new Error(ROLLBACK);
    });
  } catch (error) {
    if (error instanceof Error && error.message === ROLLBACK) {
      console.log("✓ authority integrity smoke transaction rolled back");
    } else {
      throw error;
    }
  }

  if (!instrumentId) {
    throw new Error("[ARP_2D_SMOKE_INSTRUMENT_ID_NOT_CAPTURED]");
  }

  const [
    participants,
    appointments,
    instruments,
    authorities,
    events,
    docketSequence,
  ] = await Promise.all([
    prisma.representativeProgramParticipant.count({
      where: {
        displayName: "ARP-2D Authority Integrity Smoke",
      },
    }),

    prisma.representativeProgramAppointment.count(),

    prisma.institutionalInstrument.count({
      where: {
        id: instrumentId,
      },
    }),

    prisma.instrumentAuthority.count({
      where: {
        instrumentId,
      },
    }),

    prisma.domainEvent.count({
      where: {
        streamId: instrumentId,
      },
    }),

    prisma.representativeProgramDocketSequence.findUnique({
      where: {
        year: 2026,
      },
    }),
  ]);

  assert.equal(participants, 0);
  assert.equal(appointments, 0);
  assert.equal(instruments, 0);
  assert.equal(authorities, 0);
  assert.equal(events, 0);
  assert.equal(docketSequence, null);

  const finalCounts = {
    participants: await prisma.representativeProgramParticipant.count(),
    appointments: await prisma.representativeProgramAppointment.count(),
    standingTransitions:
      await prisma.representativeProgramStandingTransition.count(),
    docketSequences: await prisma.representativeProgramDocketSequence.count(),
    authorities: await prisma.instrumentAuthority.count(),
  };

  assert.deepEqual(finalCounts, baseline);

  console.log("✓ participant rolled back");
  console.log("✓ appointment rolled back");
  console.log("✓ instrument rolled back");
  console.log("✓ authority fixtures rolled back");
  console.log("✓ authority events rolled back");
  console.log("✓ docket sequence rolled back");
  console.log("✓ FWI-26-RP-001 remains available");

  console.log("ARP_2D_AUTHORITY_INTEGRITY_OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
