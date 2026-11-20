import type { PrismaClient as PrismaClientType } from "@prisma/client";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { createRepresentativeProgramParticipantWithClient } from "../../src/domains/instruments/representative-program/commands/createRepresentativeProgramParticipantWithClient";
import { prepareRepresentativeMasterAgreementWithClient } from "../../src/domains/instruments/representative-program/onboarding/commands/prepareRepresentativeMasterAgreement";
import { assembleMasterAgreementEvidence } from "../../src/domains/instruments/representative-program/onboarding/commands/assembleMasterAgreementEvidence";
import { recordMasterAgreementExecutionWithClient } from "../../src/domains/instruments/representative-program/onboarding/commands/recordMasterAgreementExecution";
import { bindRepresentativeMasterAgreementWithClient } from "../../src/domains/instruments/representative-program/onboarding/commands/bindRepresentativeMasterAgreement";

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
} from "../../src/domains/instruments/representative-program/commands/prepareRepresentativeProgramAppointment";

type SmokeClient = Pick<
  PrismaClientType,
  | "user"
  | "representativeProgramDocketSequence"
  | "representativeProgramParticipant"
  | "representativeProgramStandingTransition"
  | "representativeProgramAppointment"
  | "representativeOnboardingIntake"
  | "institutionalInstrument"
  | "instrumentVersion"
  | "instrumentParty"
  | "instrumentRelation"
  | "instrumentEvidence"
  | "instrumentAuthority"
  | "instrumentStateTransition"
  | "domainEvent"
>;

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 10_000,
    timeout: 60_000,
  },
});

const ROLLBACK = "ARP_APPT_1_PREPARATION_SMOKE_ROLLBACK";

async function main() {
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = new URL(process.env[key] ?? "");
    assert.equal(url.hostname, "127.0.0.1", `${key}: local host required`);
    assert.equal(url.port, "5433", `${key}: local port required`);
    assert.equal(decodeURIComponent(url.pathname), "/axpt_local",
      `${key}: local database required`);
  }
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

  const fixtureKey = `SMOKE-APPT1-${randomUUID()}`;
  const candidateEmail = `${fixtureKey.toLowerCase()}@example.test`;
  const now = new Date("2026-09-30T20:40:00.000Z");

  async function baseline() {
    return {
      participants: await prisma.representativeProgramParticipant.count(),
      intakes: await prisma.representativeOnboardingIntake.count(),
      appointments: await prisma.representativeProgramAppointment.count(),
      instruments: await prisma.institutionalInstrument.count(),
      authorities: await prisma.instrumentAuthority.count(),
      events: await prisma.domainEvent.count(),
      standingTransitions:
        await prisma.representativeProgramStandingTransition.count(),
      sequences: await prisma.representativeProgramDocketSequence.findMany({
        orderBy: { year: "asc" },
      }),
    };
  }

  const before = await baseline();
  let smokeInstrumentId: string | null = null;
  let fixtureParticipantId: string | null = null;
  let fixtureIntakeId: string | null = null;
  let fixtureAgreementId: string | null = null;
  let reference = "";

  try {
    await prisma.$transaction(
      async (tx: SmokeClient) => {
        const participant =
          await createRepresentativeProgramParticipantWithClient({
            client: tx,
            displayName: "APPT-1 Synthetic Smoke Representative",
            standing: REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
            actorUserId: actor.id,
            userId: null,
            occurredAt: now,
          });

        fixtureParticipantId = participant.id;
        reference = `${participant.docketReference}-APPT-001`;
        const title =
          `French-Ward Authorized Commercial Representative Appointment — ${participant.displayName}`;

        const agreementReference = `${fixtureKey}-MASTER`;

        const agreement =
          await prepareRepresentativeMasterAgreementWithClient({
            client: tx,
            reference: agreementReference,
            title: "APPT-1 Synthetic Master Agreement",
            candidateDisplayName: participant.displayName,
            candidateEmail,
            actorUserId: actor.id,
            occurredAt: now,
          });

        fixtureAgreementId = agreement.instrumentId;

        const receipt = await assembleMasterAgreementEvidence({
          store: {
            async putPrivate(input) {
              return {
                uri: `s3://arp-smoke-only/${input.key}`,
                access: "private",
              };
            },
          },
          reference: agreementReference,
          signerEmail: candidateEmail,
          adobeAgreementId: fixtureKey,
          completedAt: now,
          reviewedByUserId: actor.id,
          reviewedAt: new Date("2026-09-30T20:41:00.000Z"),
          operatorConfirmedAllSignatures: true,
          signedPdf: new TextEncoder().encode(
            "%PDF-1.7\nSYNTHETIC SMOKE SIGNED AGREEMENT"
          ),
          auditPdf: new TextEncoder().encode(
            "%PDF-1.7\nSYNTHETIC SMOKE AUDIT"
          ),
        });

        await recordMasterAgreementExecutionWithClient({
          client: tx,
          receipt,
        });

        // Admission is a fixture precondition; this smoke tests APPT-1.
        const intake = await tx.representativeOnboardingIntake.create({
          data: {
            reference: `${fixtureKey}-INTAKE`,
            candidateDisplayName: participant.displayName,
            candidateEmail,
            status: "ADMITTED",
            admittedParticipantId: participant.id,
            admittedAt: now,
            createdByUserId: actor.id,
          },
        });

        fixtureIntakeId = intake.id;

        const binding = await bindRepresentativeMasterAgreementWithClient({
          client: tx,
          intakeId: intake.id,
          instrumentReference: agreementReference,
          actorUserId: actor.id,
          occurredAt: new Date("2026-09-30T20:42:00.000Z"),
        });

        assert.equal(binding.bound, true);
        assert.equal(binding.participantId, participant.id);

        assert.equal(
          await tx.institutionalInstrument.count({ where: { reference } }),
          0,
        );

        console.log("✓ synthetic executed Master Agreement bound canonically");

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

  assert.ok(fixtureParticipantId);
  assert.ok(fixtureIntakeId);
  assert.ok(fixtureAgreementId);

  assert.equal(
    await prisma.representativeProgramParticipant.count({
      where: { id: fixtureParticipantId },
    }), 0,
  );
  assert.equal(
    await prisma.representativeOnboardingIntake.count({
      where: { id: fixtureIntakeId },
    }), 0,
  );
  assert.equal(
    await prisma.institutionalInstrument.count({
      where: { id: { in: [smokeInstrumentId, fixtureAgreementId] } },
    }), 0,
  );
  assert.equal(
    await prisma.domainEvent.count({
      where: {
        streamId: {
          in: [smokeInstrumentId, fixtureAgreementId, fixtureParticipantId],
        },
      },
    }), 0,
  );

  assert.deepEqual(await baseline(), before);

  console.log("✓ synthetic participant and intake rolled back");
  console.log("✓ synthetic Master Agreement and Appointment rolled back");
  console.log("✓ fixture events and authority baseline restored");
  console.log("✓ docket sequence and existing records preserved");
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
