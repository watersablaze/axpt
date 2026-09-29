import assert from "node:assert/strict";

import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_AUTHORITY_CLASS,
  type InstrumentAuthority,
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

const ROLLBACK = "ARP_2C_2_REPLACEMENT_SMOKE_ROLLBACK";

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
    throw new Error("[ARP_2C_2_SMOKE_ADMIN_USER_REQUIRED]");
  }

  let instrumentId: string | null = null;

  let appointmentId: string | null = null;

  try {
    await prisma.$transaction(async (tx: SmokeClient) => {
      const admittedAt = new Date("2026-09-20T12:00:00.000Z");

      const participant =
        await createRepresentativeProgramParticipantWithClient({
          client: tx,
          displayName: "ARP-2C.2 Authority Replacement Smoke",
          standing: REPRESENTATIVE_PROGRAM_STANDING.ACTIVE,
          actorUserId: actor.id,
          userId: null,
          occurredAt: admittedAt,
        });

      const instrument = await tx.institutionalInstrument.create({
        data: {
          reference: `SMOKE-${participant.docketReference}-REPLACE`,
          kind: INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT,
          title: "ARP-2C.2 Authority Replacement Smoke Appointment",
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
            REPRESENTATIVE_APPOINTMENT_CLASS.TRANSACTION_REPRESENTATIVE,
          actorUserId: actor.id,
          effectiveAt: admittedAt,
        });

      const appointment = appointmentResult.appointment;

      appointmentId = appointment.id;

      const original = await recordRepresentativeProgramAuthorityWithClient({
        client: tx,
        appointmentId: appointment.id,
        authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
        authorityClass: INSTRUMENT_AUTHORITY_CLASS.PROHIBITED,
        action: "Negotiate transaction terms.",
        actorUserId: actor.id,
        effectiveAt: admittedAt,
      });

      assert.equal(original.created, true);

      const beforeReplacement =
        await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
          at: new Date("2026-09-20T12:05:00.000Z"),
        });

      assert.equal(beforeReplacement.exercisable, false);

      assert.equal(
        beforeReplacement.reason,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.AUTHORITY_PROHIBITED,
      );

      console.log("✓ original negotiation disposition prohibited");

      const replacementAt = new Date("2026-09-20T12:10:00.000Z");

      const replacement = await replaceRepresentativeProgramAuthorityWithClient(
        {
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
          authorityClass: INSTRUMENT_AUTHORITY_CLASS.DELEGATED,
          action:
            "Negotiate transaction terms within expressly approved commercial parameters.",
          conditions: {
            transactionReferences: ["ARP-2C.2-SMOKE"],
          },
          actorUserId: actor.id,
          replacedAt: replacementAt,
        },
      );

      assert.equal(replacement.revokedAuthorityId, original.authority.id);

      assert.notEqual(
        replacement.replacementAuthority.id,
        original.authority.id,
      );

      const rows = await tx.instrumentAuthority.findMany({
        where: {
          instrumentId: instrument.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
        },
        orderBy: {
          effectiveAt: "asc",
        },
      });

      assert.equal(rows.length, 2);

      const oldRow = rows.find(
        (row: InstrumentAuthority) => row.id === original.authority.id,
      );

      const newRow = rows.find(
        (row: InstrumentAuthority) =>
          row.id === replacement.replacementAuthority.id,
      );

      assert.ok(oldRow);
      assert.ok(newRow);

      assert.equal(oldRow.revokedAt?.getTime(), replacementAt.getTime());

      assert.equal(newRow.revokedAt, null);

      assert.equal(newRow.authorityClass, INSTRUMENT_AUTHORITY_CLASS.DELEGATED);

      console.log("✓ replacement revoked prior disposition");

      console.log("✓ replacement created new disposition");

      const activeAfter =
        await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
          at: new Date("2026-09-20T12:11:00.000Z"),
        });

      assert.equal(activeAfter.exercisable, true);

      assert.equal(
        activeAfter.reason,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.EXERCISABLE,
      );

      assert.equal(
        activeAfter.authority?.id,
        replacement.replacementAuthority.id,
      );

      console.log("✓ replacement is the sole operative disposition");

      const directRevocationAt = new Date("2026-09-20T12:20:00.000Z");

      const revocation = await revokeRepresentativeProgramAuthorityWithClient({
        client: tx,
        appointmentId: appointment.id,
        authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
        revokedByUserId: actor.id,
        revokedAt: directRevocationAt,
      });

      assert.equal(revocation.revoked, true);

      assert.equal(revocation.authorityId, replacement.replacementAuthority.id);

      const afterRevocation =
        await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
          at: new Date("2026-09-20T12:21:00.000Z"),
        });

      assert.equal(afterRevocation.exercisable, false);

      assert.equal(
        afterRevocation.reason,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.AUTHORITY_NOT_RECORDED,
      );

      console.log("✓ explicit revocation removes current exercisability");

      const secondRevocation =
        await revokeRepresentativeProgramAuthorityWithClient({
          client: tx,
          appointmentId: appointment.id,
          authorityKey: REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
          revokedByUserId: actor.id,
          revokedAt: new Date("2026-09-20T12:22:00.000Z"),
        });

      assert.equal(secondRevocation.revoked, false);

      assert.equal(secondRevocation.authorityId, null);

      console.log("✓ repeated Program revocation is idempotent");

      const authorityEvents = await tx.domainEvent.findMany({
        where: {
          streamId: instrument.id,
          eventType: {
            in: [
              "INSTRUMENT_AUTHORITY_RECORDED",
              "INSTRUMENT_AUTHORITY_REVOKED",
            ],
          },
        },
        orderBy: {
          occurredAt: "asc",
        },
      });

      assert.equal(authorityEvents.length, 4);

      console.log(
        "✓ replacement history represented by canonical authority events",
      );

      throw new Error(ROLLBACK);
    });
  } catch (error) {
    if (error instanceof Error && error.message === ROLLBACK) {
      console.log("✓ replacement smoke transaction rolled back");
    } else {
      throw error;
    }
  }

  if (!instrumentId || !appointmentId) {
    throw new Error("[ARP_2C_2_SMOKE_ID_CAPTURE_FAILED]");
  }

  const [participants, instruments, authorities, events] = await Promise.all([
    prisma.representativeProgramParticipant.count({
      where: {
        displayName: "ARP-2C.2 Authority Replacement Smoke",
      },
    }),

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
  ]);

  assert.equal(participants, 0);

  assert.equal(instruments, 0);

  assert.equal(authorities, 0);

  assert.equal(events, 0);

  console.log("✓ participant rolled back");

  console.log("✓ appointment instrument rolled back");

  console.log("✓ authority history rolled back");

  console.log("✓ authority events rolled back");

  console.log("ARP_2C_2_AUTHORITY_REPLACEMENT_OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
