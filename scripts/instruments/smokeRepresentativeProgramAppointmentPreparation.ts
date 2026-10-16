import assert from "node:assert/strict";

import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_RELATION_TYPE,
  INSTRUMENT_VERSION_STATUS,
} from "../../src/domains/instruments/contracts";

import {
  REPRESENTATIVE_APPOINTMENT_CLASS,
  REPRESENTATIVE_APPOINTMENT_FORM,
  REPRESENTATIVE_PROGRAM_STANDING,
} from "../../src/domains/instruments/representative-program/contracts";

import {
  prepareRepresentativeProgramAppointmentWithClient,
  type RepresentativeProgramAppointmentPreparationClient,
} from "../../src/domains/instruments/representative-program/commands/prepareRepresentativeProgramAppointment";

type SmokeClient = RepresentativeProgramAppointmentPreparationClient &
  Pick<PrismaClientType, "instrumentAuthority">;

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 10_000,
    timeout: 60_000,
  },
});

const ROLLBACK = "ARP_APPT_1_PREPARATION_SMOKE_ROLLBACK";

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
    throw new Error("[ARP_APPT1_ADMIN_USER_REQUIRED]");
  }

  const participant = await prisma.representativeProgramParticipant.findUnique({
    where: {
      docketReference: "FWI-26-RP-001",
    },
    include: {
      onboardingIntake: true,
      appointments: true,
    },
  });

  if (!participant) {
    throw new Error("[ARP_APPT1_SYNTHETIC_PARTICIPANT_REQUIRED]");
  }

  assert.equal(
    participant.standing,
    REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
  );

  assert.ok(participant.onboardingIntake);
  assert.ok(participant.onboardingIntake.masterAgreementInstrumentId);

  const reference = `${participant.docketReference}-APPT-001`;

  const title = `French-Ward Authorized Commercial Representative Appointment — ${participant.displayName}`;

  const baselineAppointmentCount =
    await prisma.representativeProgramAppointment.count({
      where: {
        participantId: participant.id,
      },
    });

  assert.equal(
    await prisma.institutionalInstrument.count({
      where: {
        reference,
      },
    }),
    0,
  );

  let smokeInstrumentId: string | null = null;

  try {
    await prisma.$transaction(
      async (tx: SmokeClient) => {
        const prepared =
          await prepareRepresentativeProgramAppointmentWithClient({
            client: tx,
            participantId: participant.id,
            reference,
            title,
            appointmentClass:
              REPRESENTATIVE_APPOINTMENT_CLASS.AUTHORIZED_COMMERCIAL_REPRESENTATIVE,
            appointmentForm:
              REPRESENTATIVE_APPOINTMENT_FORM.INDIVIDUAL_REPRESENTATION,
            actorUserId: actor.id,
            occurredAt: new Date("2026-09-30T20:45:00.000Z"),
          });

        assert.equal(prepared.created, true);

        smokeInstrumentId = prepared.instrumentId;

        const instrument = await tx.institutionalInstrument.findUniqueOrThrow({
          where: {
            id: prepared.instrumentId,
          },
          include: {
            versions: true,
            representativeProgramAppointment: true,
            parties: true,
            outboundRelations: true,
            evidence: true,
          },
        });

        assert.equal(
          instrument.kind,
          INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT,
        );

        assert.equal(instrument.status, INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT);

        assert.equal(instrument.currentVersion, 1);

        assert.equal(instrument.versions.length, 1);

        assert.equal(
          instrument.versions[0]?.status,
          INSTRUMENT_VERSION_STATUS.DRAFT,
        );

        const appointment = instrument.representativeProgramAppointment;

        assert.ok(appointment);

        assert.equal(appointment.participantId, participant.id);

        assert.equal(
          appointment.appointmentClass,
          REPRESENTATIVE_APPOINTMENT_CLASS.AUTHORIZED_COMMERCIAL_REPRESENTATIVE,
        );

        assert.equal(appointment.effectiveAt, null);
        assert.equal(appointment.expiresAt, null);
        assert.equal(appointment.endedAt, null);

        assert.deepEqual(appointment.scope, {
          appointmentForm:
            REPRESENTATIVE_APPOINTMENT_FORM.INDIVIDUAL_REPRESENTATION,
          masterAgreementReference: prepared.masterAgreementReference,
        });

        assert.ok(
          instrument.parties.some(
            (party: { displayName: string; role: string }) =>
              party.displayName === participant.displayName &&
              party.role === "COMMERCIAL_PARTICIPANT",
          ),
        );

        assert.ok(
          instrument.outboundRelations.some(
            (relation: { targetInstrumentId: string; relationType: string }) =>
              relation.targetInstrumentId ===
                prepared.masterAgreementInstrumentId &&
              relation.relationType === INSTRUMENT_RELATION_TYPE.DERIVES_FROM,
          ),
        );

        assert.ok(
          instrument.evidence.some(
            (item: { title: string }) =>
              item.title === "Appointment participant designation",
          ),
        );

        assert.equal(
          await tx.instrumentAuthority.count({
            where: {
              instrumentId: instrument.id,
            },
          }),
          0,
        );

        const participantInside =
          await tx.representativeProgramParticipant.findUniqueOrThrow({
            where: {
              id: participant.id,
            },
          });

        assert.equal(
          participantInside.standing,
          REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
        );

        console.log("✓ admitted participant remains PROVISIONAL");
        console.log(`✓ Appointment Instrument prepared: ${reference}`);
        console.log("✓ Appointment Instrument state: DRAFT");
        console.log("✓ Appointment Form: INDIVIDUAL_REPRESENTATION");
        console.log(
          "✓ Appointment Class: AUTHORIZED_COMMERCIAL_REPRESENTATIVE",
        );
        console.log(
          "✓ Appointment derives from bound EXECUTED Master Agreement",
        );
        console.log("✓ no InstrumentAuthority rows created");
        console.log("✓ no effective appointment date established");

        const replay = await prepareRepresentativeProgramAppointmentWithClient({
          client: tx,
          participantId: participant.id,
          reference,
          title,
          appointmentClass:
            REPRESENTATIVE_APPOINTMENT_CLASS.AUTHORIZED_COMMERCIAL_REPRESENTATIVE,
          appointmentForm:
            REPRESENTATIVE_APPOINTMENT_FORM.INDIVIDUAL_REPRESENTATION,
          actorUserId: actor.id,
          occurredAt: new Date("2026-09-30T20:45:00.000Z"),
        });

        assert.equal(replay.created, false);
        assert.equal(replay.instrumentId, prepared.instrumentId);
        assert.equal(replay.appointmentId, prepared.appointmentId);

        assert.equal(
          await tx.representativeProgramAppointment.count({
            where: {
              instrumentId: instrument.id,
            },
          }),
          1,
        );

        console.log("✓ exact APPT-1 replay is idempotent");

        throw new Error(ROLLBACK);
      },
      {
        maxWait: 10_000,
        timeout: 60_000,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === ROLLBACK) {
      console.log("✓ APPT-1 smoke transaction rolled back");
    } else {
      throw error;
    }
  }

  assert.ok(smokeInstrumentId);

  const participantAfter =
    await prisma.representativeProgramParticipant.findUniqueOrThrow({
      where: {
        id: participant.id,
      },
    });

  assert.equal(
    participantAfter.standing,
    REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
  );

  assert.equal(
    await prisma.representativeProgramAppointment.count({
      where: {
        participantId: participant.id,
      },
    }),
    baselineAppointmentCount,
  );

  assert.equal(
    await prisma.institutionalInstrument.count({
      where: {
        id: smokeInstrumentId,
      },
    }),
    0,
  );

  assert.equal(
    await prisma.instrumentAuthority.count({
      where: {
        instrumentId: smokeInstrumentId,
      },
    }),
    0,
  );

  assert.equal(
    await prisma.domainEvent.count({
      where: {
        streamId: smokeInstrumentId,
      },
    }),
    0,
  );

  console.log("✓ durable participant standing preserved");
  console.log("✓ durable appointment count restored");
  console.log("✓ Appointment Instrument rolled back");
  console.log("✓ Appointment events rolled back");
  console.log(`✓ ${reference} remains available`);
  console.log("ARP_APPT_1_PREPARATION_OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
