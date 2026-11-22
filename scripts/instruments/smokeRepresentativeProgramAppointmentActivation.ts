import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  PrismaClient,
} from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_EVIDENCE_SUBJECT,
  INSTRUMENT_EVIDENCE_TYPE,
} from "../../src/domains/instruments/contracts";

import {
  REPRESENTATIVE_APPOINTMENT_CLASS,
  REPRESENTATIVE_APPOINTMENT_FORM,
  REPRESENTATIVE_PROGRAM_STANDING,
} from "../../src/domains/instruments/representative-program/contracts";

import {
  activateRepresentativeProgramAppointmentWithClient,
} from "../../src/domains/instruments/representative-program/commands/activateRepresentativeProgramAppointment";

import {
  prepareRepresentativeProgramAppointmentWithClient,
} from "../../src/domains/instruments/representative-program/commands/prepareRepresentativeProgramAppointment";

import {
  recordInstrumentEvidenceWithClient,
} from "../../src/domains/instruments/commands/recordInstrumentEvidenceWithClient";

import {
  admitRepresentativeOnboardingWithClient,
} from "../../src/domains/instruments/representative-program/onboarding/commands/admitRepresentativeOnboarding";

import {
  assembleMasterAgreementEvidence,
} from "../../src/domains/instruments/representative-program/onboarding/commands/assembleMasterAgreementEvidence";

import {
  bindRepresentativeMasterAgreementWithClient,
} from "../../src/domains/instruments/representative-program/onboarding/commands/bindRepresentativeMasterAgreement";

import {
  prepareRepresentativeMasterAgreementWithClient,
} from "../../src/domains/instruments/representative-program/onboarding/commands/prepareRepresentativeMasterAgreement";

import {
  recordMasterAgreementExecutionWithClient,
} from "../../src/domains/instruments/representative-program/onboarding/commands/recordMasterAgreementExecution";

const prisma =
  new PrismaClient({
    transactionOptions: {
      maxWait: 10_000,
      timeout: 60_000,
    },
  });

const ROLLBACK =
  "ARP_APPT_2A_ACCEPTANCE_GATE_ROLLBACK";

function requireLocalDatabase() {
  for (const key of [
    "DATABASE_URL",
    "DIRECT_URL",
  ]) {
    const url =
      new URL(process.env[key] ?? "");

    assert.equal(
      url.hostname,
      "127.0.0.1",
      `${key}: local host required`,
    );

    assert.equal(
      url.port,
      "5433",
      `${key}: local port required`,
    );

    assert.equal(
      decodeURIComponent(url.pathname),
      "/axpt_local",
      `${key}: local database required`,
    );
  }
}

async function main() {
  requireLocalDatabase();

  const actor =
    await prisma.user.findFirst({
      where: {
        isAdmin: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  assert(
    actor,
    "ARP_APPT_2A_ADMIN_USER_REQUIRED",
  );

  const before = {
    users:
      await prisma.user.count(),
    participants:
      await prisma.representativeProgramParticipant.count(),
    intakes:
      await prisma.representativeOnboardingIntake.count(),
    appointments:
      await prisma.representativeProgramAppointment.count(),
    instruments:
      await prisma.institutionalInstrument.count(),
    evidence:
      await prisma.instrumentEvidence.count(),
    authorities:
      await prisma.instrumentAuthority.count(),
    transitions:
      await prisma.instrumentStateTransition.count(),
    standingTransitions:
      await prisma.representativeProgramStandingTransition.count(),
    events:
      await prisma.domainEvent.count(),
    sequences:
      await prisma.representativeProgramDocketSequence.findMany({
        orderBy: {
          year: "asc",
        },
      }),
  };

  const fixture =
    `APPT-2A-${randomUUID()}`;

  const candidateEmail =
    `${fixture.toLowerCase()}@axpt.local`;

  const candidateDisplayName =
    `APPT-2A Representative ${fixture}`;

  const intakeReference =
    `${fixture}-INTAKE`;

  const agreementReference =
    `${fixture}-MASTER`;

  const agreementCompletedAt =
    new Date("2026-10-04T08:00:00.000Z");

  const agreementReviewedAt =
    new Date("2026-10-04T08:05:00.000Z");

  const admittedAt =
    new Date("2026-10-04T08:10:00.000Z");

  const preparedAt =
    new Date("2026-10-04T08:15:00.000Z");

  const acceptedAt =
    new Date("2026-10-04T08:20:00.000Z");

  const activatedAt =
    new Date("2026-10-04T08:25:00.000Z");

  try {
    await prisma.$transaction(
      async (tx: any) => {
        const intake =
          await tx.representativeOnboardingIntake.create({
            data: {
              reference:
                intakeReference,
              status:
                "QUALIFIED",
              qualificationDecision:
                "QUALIFIED",
              candidateDisplayName,
              candidateEmail,
              submission: {
                smoke:
                  "APPT-2A",
              },
              createdByUserId:
                actor.id,
              submittedAt:
                agreementCompletedAt,
              reviewStartedAt:
                agreementCompletedAt,
              qualifiedAt:
                agreementCompletedAt,
            },
          });

        const representativeUser =
          await tx.user.create({
            data: {
              username:
                `appt2a-${randomUUID()}`,
              passwordHash:
                `smoke-not-a-login-${randomUUID()}`,
              email:
                candidateEmail,
              isAdmin:
                false,
              displayName:
                candidateDisplayName,
              tier:
                "representative",
              viewedDocs:
                [],
              metadata: {
                smoke:
                  "APPT-2A",
                purpose:
                  "release-compatible activation identity fixture",
              },
            },
          });

        assert.equal(
          representativeUser.isAdmin,
          false,
        );

        assert.equal(
          representativeUser.tier,
          "representative",
        );

        const admission =
          await admitRepresentativeOnboardingWithClient({
            client:
              tx,
            intakeId:
              intake.id,
            actorUserId:
              actor.id,
            occurredAt:
              admittedAt,
          });

        assert.equal(
          admission.participant.standing,
          REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
        );

        const linked =
          await tx.representativeProgramParticipant.update({
            where: {
              id:
                admission.participant.id,
            },
            data: {
              userId:
                representativeUser.id,
            },
          });

        assert.equal(
          linked.userId,
          representativeUser.id,
        );

        const agreement =
          await prepareRepresentativeMasterAgreementWithClient({
            client:
              tx,
            reference:
              agreementReference,
            title:
              "APPT-2A Synthetic Program Master Agreement",
            candidateDisplayName,
            candidateEmail,
            actorUserId:
              actor.id,
            occurredAt:
              agreementCompletedAt,
          });

        const receipt =
          await assembleMasterAgreementEvidence({
            store: {
              async putPrivate(input) {
                return {
                  uri:
                    `s3://arp-appt-2a-smoke/${input.key}`,
                  access:
                    "private",
                };
              },
            },
            reference:
              agreementReference,
            signerEmail:
              candidateEmail,
            adobeAgreementId:
              fixture,
            completedAt:
              agreementCompletedAt,
            sourceTimezone:
              "GMT",
            reviewedByUserId:
              actor.id,
            reviewedAt:
              agreementReviewedAt,
            operatorConfirmedAllSignatures:
              true,
            signedPdf:
              new TextEncoder().encode(
                "%PDF-1.7\nAPPT-2A SYNTHETIC AGREEMENT",
              ),
            auditPdf:
              new TextEncoder().encode(
                "%PDF-1.7\nAPPT-2A SYNTHETIC AUDIT",
              ),
          });

        await recordMasterAgreementExecutionWithClient({
          client:
            tx,
          receipt,
        });

        const binding =
          await bindRepresentativeMasterAgreementWithClient({
            client:
              tx,
            intakeId:
              intake.id,
            instrumentReference:
              agreementReference,
            actorUserId:
              actor.id,
            occurredAt:
              agreementReviewedAt,
          });

        assert.equal(
          binding.bound,
          true,
        );

        const participant =
          await tx.representativeProgramParticipant.findUniqueOrThrow({
            where: {
              id:
                admission.participant.id,
            },
          });

        assert.equal(
          participant.userId,
          representativeUser.id,
        );

        assert.equal(
          participant.standing,
          REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
        );

        const appointmentReference =
          `${participant.docketReference}-APPT-001`;

        const prepared =
          await prepareRepresentativeProgramAppointmentWithClient({
            client:
              tx,
            participantId:
              participant.id,
            reference:
              appointmentReference,
            title:
              `French-Ward Authorized Commercial Representative Appointment — ${candidateDisplayName}`,
            appointmentClass:
              REPRESENTATIVE_APPOINTMENT_CLASS
                .AUTHORIZED_COMMERCIAL_REPRESENTATIVE,
            appointmentForm:
              REPRESENTATIVE_APPOINTMENT_FORM
                .INDIVIDUAL_REPRESENTATION,
            actorUserId:
              actor.id,
            occurredAt:
              preparedAt,
          });

        const authorityBefore =
          await tx.instrumentAuthority.count({
            where: {
              instrumentId:
                prepared.instrumentId,
            },
          });

        assert.equal(
          authorityBefore,
          0,
        );

        await assert.rejects(
          () =>
            activateRepresentativeProgramAppointmentWithClient({
              client:
                tx,
              appointmentId:
                prepared.appointmentId,
              actorUserId:
                actor.id,
              occurredAt:
                activatedAt,
            }),
          (error: unknown) =>
            error instanceof Error &&
            error.message.includes(
              "ARP_APPOINTMENT_ACTIVATION_REPRESENTATIVE_ACCEPTANCE_REQUIRED",
            ),
        );

        const rejectedInstrument =
          await tx.institutionalInstrument.findUniqueOrThrow({
            where: {
              id:
                prepared.instrumentId,
            },
          });

        const rejectedAppointment =
          await tx.representativeProgramAppointment.findUniqueOrThrow({
            where: {
              id:
                prepared.appointmentId,
            },
          });

        const rejectedParticipant =
          await tx.representativeProgramParticipant.findUniqueOrThrow({
            where: {
              id:
                participant.id,
            },
          });

        assert.equal(
          rejectedInstrument.status,
          INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT,
        );

        assert.equal(
          rejectedAppointment.effectiveAt,
          null,
        );

        assert.equal(
          rejectedParticipant.standing,
          REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
        );

        assert.equal(
          await tx.instrumentAuthority.count({
            where: {
              instrumentId:
                prepared.instrumentId,
            },
          }),
          0,
        );

        console.log(
          "✓ activation rejected without representative acceptance",
        );

        await recordInstrumentEvidenceWithClient({
          client:
            tx,
          instrumentReference:
            appointmentReference,
          evidenceType:
            INSTRUMENT_EVIDENCE_TYPE.ATTESTATION,
          subjectType:
            INSTRUMENT_EVIDENCE_SUBJECT.EXECUTION,
          subjectId:
            prepared.appointmentId,
          title:
            "Representative appointment acceptance",
          metadata: {
            acceptedByUserId:
              representativeUser.id,
            participantId:
              participant.id,
            appointmentId:
              prepared.appointmentId,
            instrumentReference:
              appointmentReference,
            acceptedAt:
              acceptedAt.toISOString(),
            acceptanceMethod:
              "AUTHENTICATED_REPRESENTATIVE_WORKSPACE",
            smoke:
              "APPT-2A",
          },
          recordedByUserId:
            representativeUser.id,
          recordedAt:
            acceptedAt,
        });

        const activated =
          await activateRepresentativeProgramAppointmentWithClient({
            client:
              tx,
            appointmentId:
              prepared.appointmentId,
            actorUserId:
              actor.id,
            occurredAt:
              activatedAt,
          });

        assert.equal(
          activated.activated,
          true,
        );

        assert.equal(
          activated.participantStanding,
          REPRESENTATIVE_PROGRAM_STANDING.ACTIVE,
        );

        assert.equal(
          activated.effectiveAt.toISOString(),
          activatedAt.toISOString(),
        );

        const activeInstrument =
          await tx.institutionalInstrument.findUniqueOrThrow({
            where: {
              id:
                prepared.instrumentId,
            },
          });

        assert.equal(
          activeInstrument.status,
          INSTITUTIONAL_INSTRUMENT_STATUS.ACTIVE,
        );

        const activeParticipant =
          await tx.representativeProgramParticipant.findUniqueOrThrow({
            where: {
              id:
                participant.id,
            },
          });

        assert.equal(
          activeParticipant.standing,
          REPRESENTATIVE_PROGRAM_STANDING.ACTIVE,
        );

        assert.equal(
          await tx.instrumentAuthority.count({
            where: {
              instrumentId:
                prepared.instrumentId,
            },
          }),
          0,
        );

        console.log(
          "✓ exact representative acceptance permits internal activation",
        );

        console.log(
          "✓ activation creates no authority",
        );

        const replay =
          await activateRepresentativeProgramAppointmentWithClient({
            client:
              tx,
            appointmentId:
              prepared.appointmentId,
            actorUserId:
              actor.id,
            occurredAt:
              new Date("2026-10-04T08:30:00.000Z"),
          });

        assert.equal(
          replay.activated,
          false,
        );

        assert.equal(
          replay.effectiveAt.toISOString(),
          activatedAt.toISOString(),
        );

        assert.equal(
          await tx.instrumentAuthority.count({
            where: {
              instrumentId:
                prepared.instrumentId,
            },
          }),
          0,
        );

        console.log(
          "✓ activation replay is idempotent",
        );

        throw new Error(
          ROLLBACK,
        );
      },
      {
        maxWait:
          10_000,
        timeout:
          60_000,
      },
    );
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== ROLLBACK
    ) {
      throw error;
    }

    console.log(
      "✓ APPT-2A transaction rolled back",
    );
  }

  const after = {
    users:
      await prisma.user.count(),
    participants:
      await prisma.representativeProgramParticipant.count(),
    intakes:
      await prisma.representativeOnboardingIntake.count(),
    appointments:
      await prisma.representativeProgramAppointment.count(),
    instruments:
      await prisma.institutionalInstrument.count(),
    evidence:
      await prisma.instrumentEvidence.count(),
    authorities:
      await prisma.instrumentAuthority.count(),
    transitions:
      await prisma.instrumentStateTransition.count(),
    standingTransitions:
      await prisma.representativeProgramStandingTransition.count(),
    events:
      await prisma.domainEvent.count(),
    sequences:
      await prisma.representativeProgramDocketSequence.findMany({
        orderBy: {
          year: "asc",
        },
      }),
  };

  assert.deepEqual(
    after,
    before,
  );

  console.log(
    "✓ fixture identity, admission, agreement, appointment and evidence rolled back",
  );

  console.log(
    "✓ authority and docket baselines restored",
  );

  console.log(
    "ARP_APPT_2A_ACCEPTANCE_GATE_OK",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
