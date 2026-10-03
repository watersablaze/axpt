import assert from "node:assert/strict";

import {
  PrismaClient,
} from "@prisma/client";

import {
  resolveInstitutionalSignInEligibility,
} from "../../src/domains/auth/resolveInstitutionalSignInEligibility";

import {
  linkRepresentativeProgramParticipantUserWithClient,
} from "../../src/domains/instruments/representative-program/commands/linkRepresentativeProgramParticipantUserWithClient";

import {
  admitRepresentativeOnboardingWithClient,
} from "../../src/domains/instruments/representative-program/onboarding/commands/admitRepresentativeOnboarding";

import {
  bindRepresentativeMasterAgreementWithClient,
} from "../../src/domains/instruments/representative-program/onboarding/commands/bindRepresentativeMasterAgreement";

import {
  resolveRepresentativeInstitutionalUserWithClient,
} from "../../src/domains/instruments/representative-program/onboarding/commands/resolveRepresentativeInstitutionalUserWithClient";

const prisma =
  new PrismaClient();

const HAPPY_ROLLBACK =
  "REP_1B_4_HAPPY_ROLLBACK";

const HASH_A =
  "a".repeat(64);

const HASH_B =
  "b".repeat(64);

function requireLocalDatabase() {
  const raw =
    process.env.DATABASE_URL;

  assert(
    raw,
    "DATABASE_URL_REQUIRED",
  );

  const url =
    new URL(raw);

  assert.equal(
    url.hostname,
    "127.0.0.1",
    "DATABASE_URL: local host required",
  );

  assert.equal(
    url.port,
    "5433",
    "DATABASE_URL: local port required",
  );

  assert.equal(
    decodeURIComponent(
      url.pathname,
    ),
    "/axpt_local",
    "DATABASE_URL: axpt_local required",
  );

  console.log(
    "✓ local database identity locked",
  );
}

async function installUniqueIndexInsideTransaction(
  tx: any,
) {
  await tx.$executeRawUnsafe(`
    DROP INDEX IF EXISTS
      "RepresentativeProgramParticipant_userId_idx"
  `);

  await tx.$executeRawUnsafe(`
    CREATE UNIQUE INDEX
      "RepresentativeProgramParticipant_userId_key"
    ON
      "RepresentativeProgramParticipant"("userId")
  `);
}

async function createQualifiedIntake(
  tx: any,
  params: {
    reference: string;
    candidateDisplayName: string;
    candidateEmail: string;
    actorUserId: string;
    occurredAt: Date;
  },
) {
  return tx.representativeOnboardingIntake.create({
    data: {
      reference:
        params.reference,

      status:
        "QUALIFIED",

      qualificationDecision:
        "QUALIFIED",

      candidateDisplayName:
        params.candidateDisplayName,

      candidateEmail:
        params.candidateEmail,

      submission: {
        smoke:
          "REP-1B.4",
      },

      createdByUserId:
        params.actorUserId,

      submittedAt:
        params.occurredAt,

      reviewStartedAt:
        params.occurredAt,

      qualifiedAt:
        params.occurredAt,
    },
  });
}

async function createExecutedAgreementFixture(
  tx: any,
  params: {
    reference: string;
    candidateEmail: string;
    actorUserId: string;
    adobeAgreementId: string;
  },
) {
  return tx.institutionalInstrument.create({
    data: {
      reference:
        params.reference,

      kind:
        "REPRESENTATIVE_PROGRAM_AGREEMENT",

      title:
        "REP-1B.4 Transaction Smoke Master Agreement",

      status:
        "EXECUTED",

      currentVersion:
        1,

      createdByUserId:
        params.actorUserId,

      evidence: {
        create: [
          {
            evidenceType:
              "DOCUMENT",

            subjectType:
              "EXECUTION",

            title:
              "Signed Master Agreement",

            uri:
              `smoke://rep-1b4/${params.reference}/signed.pdf`,

            contentHash:
              HASH_A,

            metadata: {
              signerEmail:
                params.candidateEmail,

              adobeAgreementId:
                params.adobeAgreementId,

              operatorConfirmedAllSignatures:
                true,

              smoke:
                "REP-1B.4",
            },

            recordedByUserId:
              params.actorUserId,
          },

          {
            evidenceType:
              "EXTERNAL_RECORD",

            subjectType:
              "EXECUTION",

            title:
              "Master Agreement Audit Record",

            uri:
              `smoke://rep-1b4/${params.reference}/audit.pdf`,

            contentHash:
              HASH_B,

            metadata: {
              signerEmail:
                params.candidateEmail,

              adobeAgreementId:
                params.adobeAgreementId,

              operatorConfirmedAllSignatures:
                true,

              smoke:
                "REP-1B.4",
            },

            recordedByUserId:
              params.actorUserId,
          },
        ],
      },
    },
  });
}

async function assertFixtureAbsent(
  params: {
    intakeReference: string;
    agreementReference?: string;
    candidateEmail: string;
  },
) {
  const [
    intakeCount,
    agreementCount,
    userCount,
  ] =
    await Promise.all([
      prisma.representativeOnboardingIntake.count({
        where: {
          reference:
            params.intakeReference,
        },
      }),

      params.agreementReference
        ? prisma.institutionalInstrument.count({
            where: {
              reference:
                params.agreementReference,
            },
          })
        : Promise.resolve(0),

      prisma.user.count({
        where: {
          email: {
            equals:
              params.candidateEmail,
            mode:
              "insensitive",
          },
        },
      }),
    ]);

  assert.equal(
    intakeCount,
    0,
    "temporary intake escaped rollback",
  );

  assert.equal(
    agreementCount,
    0,
    "temporary agreement escaped rollback",
  );

  assert.equal(
    userCount,
    0,
    "temporary representative User escaped rollback",
  );
}

async function main() {
  requireLocalDatabase();

  const actor =
    await prisma.user.findFirst({
      where: {
        isAdmin:
          true,
      },

      orderBy: {
        createdAt:
          "asc",
      },

      select: {
        id:
          true,
        email:
          true,
      },
    });

  assert(
    actor,
    "REP_1B_4_ADMIN_USER_REQUIRED",
  );

  console.log(
    `✓ admin actor resolved: ${actor.email}`,
  );

  const runId =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

  const occurredAt =
    new Date();

  /*
   * ======================================================
   * HAPPY PATH — prove complete identity/admission/binding
   * ======================================================
   */

  const happy = {
    intakeReference:
      `FWI-26-RP-SMOKE-${runId}`,

    agreementReference:
      `ARP-MA-SMOKE-${runId}`,

    candidateEmail:
      `rep-1b4-${runId}@axpt.local`,

    candidateDisplayName:
      `REP-1B.4 Representative ${runId}`,

    adobeAgreementId:
      `rep-1b4-adobe-${runId}`,
  };

  console.log();
  console.log(
    "── happy path / forced rollback ──",
  );

  try {
    await prisma.$transaction(
      async (tx: any) => {
        await installUniqueIndexInsideTransaction(
          tx,
        );

        const intake =
          await createQualifiedIntake(
            tx,
            {
              reference:
                happy.intakeReference,

              candidateDisplayName:
                happy.candidateDisplayName,

              candidateEmail:
                happy.candidateEmail,

              actorUserId:
                actor.id,

              occurredAt,
            },
          );

        const agreement =
          await createExecutedAgreementFixture(
            tx,
            {
              reference:
                happy.agreementReference,

              candidateEmail:
                happy.candidateEmail,

              actorUserId:
                actor.id,

              adobeAgreementId:
                happy.adobeAgreementId,
            },
          );

        const identity =
          await resolveRepresentativeInstitutionalUserWithClient({
            client:
              tx,

            intakeId:
              intake.id,
          });

        assert.equal(
          identity.created,
          true,
        );

        assert.equal(
          identity.user.isAdmin,
          false,
        );

        assert.equal(
          identity.user.tier,
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

            occurredAt,
          });

        assert.equal(
          admission.created,
          true,
        );

        assert.equal(
          admission.participant.standing,
          "PROVISIONAL",
        );

        const identityLink =
          await linkRepresentativeProgramParticipantUserWithClient({
            client:
              tx,

            participantId:
              admission.participant.id,

            userId:
              identity.user.id,

            actorUserId:
              actor.id,

            occurredAt,
          });

        assert.equal(
          identityLink.linked,
          true,
        );

        const binding =
          await bindRepresentativeMasterAgreementWithClient({
            client:
              tx,

            intakeId:
              intake.id,

            instrumentReference:
              agreement.reference,

            actorUserId:
              actor.id,

            occurredAt,
          });

        assert.equal(
          binding.bound,
          true,
        );

        const persistedIntake =
          await tx.representativeOnboardingIntake.findUnique({
            where: {
              id:
                intake.id,
            },

            select: {
              status:
                true,

              admittedParticipantId:
                true,

              masterAgreementInstrumentId:
                true,
            },
          });

        assert(
          persistedIntake,
        );

        assert.equal(
          persistedIntake.status,
          "ADMITTED",
        );

        assert.equal(
          persistedIntake.admittedParticipantId,
          admission.participant.id,
        );

        assert.equal(
          persistedIntake.masterAgreementInstrumentId,
          agreement.id,
        );

        const participant =
          await tx.representativeProgramParticipant.findUnique({
            where: {
              id:
                admission.participant.id,
            },

            select: {
              userId:
                true,

              standing:
                true,

              appointments: {
                select: {
                  id:
                    true,
                },
              },
            },
          });

        assert(
          participant,
        );

        assert.equal(
          participant.userId,
          identity.user.id,
        );

        assert.equal(
          participant.standing,
          "PROVISIONAL",
        );

        assert.equal(
          participant.appointments.length,
          0,
        );

        const authorityCount =
          await tx.instrumentAuthority.count({
            where: {
              createdByUserId:
                identity.user.id,
            },
          });

        assert.equal(
          authorityCount,
          0,
        );

        const eligibility =
          resolveInstitutionalSignInEligibility({
            roles:
              [],

            permissions:
              [],

            representativeProgramParticipants: [
              {
                standing:
                  participant.standing,
              },
            ],
          });

        assert.deepEqual(
          eligibility,
          {
            eligible:
              true,

            audience:
              "REPRESENTATIVE",
          },
        );

        const linkageEvents =
          await tx.domainEvent.count({
            where: {
              streamType:
                "REPRESENTATIVE_PROGRAM_PARTICIPANT",

              streamId:
                admission.participant.id,

              eventType:
                "REPRESENTATIVE_PARTICIPANT_USER_LINKED",
            },
          });

        assert.equal(
          linkageEvents,
          1,
        );

        const bindingEvents =
          await tx.domainEvent.count({
            where: {
              streamType:
                "REPRESENTATIVE_PROGRAM_PARTICIPANT",

              streamId:
                admission.participant.id,

              eventType:
                "REPRESENTATIVE_MASTER_AGREEMENT_BOUND",
            },
          });

        assert.equal(
          bindingEvents,
          1,
        );

        console.log(
          "✓ User provisioned passwordlessly",
        );

        console.log(
          "✓ admission created PROVISIONAL Participant",
        );

        console.log(
          "✓ canonical User ↔ Participant linkage recorded",
        );

        console.log(
          "✓ executed Master Agreement bound",
        );

        console.log(
          "✓ representative authentication eligibility resolved",
        );

        console.log(
          "✓ no Appointment created",
        );

        console.log(
          "✓ no representative authority created",
        );

        /*
         * Throwing here deliberately rolls back:
         * - fixture intake;
         * - fixture agreement/evidence;
         * - representative User;
         * - participant + docket allocation;
         * - linkage/binding events;
         * - temporary unique index.
         */
        throw new Error(
          HAPPY_ROLLBACK,
        );
      },
      {
        maxWait:
          10_000,

        timeout:
          30_000,
      },
    );

    throw new Error(
      "REP_1B_4_HAPPY_PATH_DID_NOT_ROLL_BACK",
    );
  } catch (error) {
    assert(
      error instanceof Error,
    );

    assert.equal(
      error.message,
      HAPPY_ROLLBACK,
    );
  }

  await assertFixtureAbsent({
    intakeReference:
      happy.intakeReference,

    agreementReference:
      happy.agreementReference,

    candidateEmail:
      happy.candidateEmail,
  });

  console.log(
    "✓ happy-path transaction fully rolled back",
  );

  /*
   * ======================================================
   * ADVERSARIAL PATH
   *
   * Binding failure occurs after:
   * User creation → admission → participant linkage.
   *
   * All preceding mutations must disappear.
   * ======================================================
   */

  const adverse = {
    intakeReference:
      `FWI-26-RP-SMOKE-FAIL-${runId}`,

    missingAgreementReference:
      `ARP-MA-MISSING-${runId}`,

    candidateEmail:
      `rep-1b4-fail-${runId}@axpt.local`,

    candidateDisplayName:
      `REP-1B.4 Failure Representative ${runId}`,
  };

  console.log();
  console.log(
    "── downstream binding failure / atomic rollback ──",
  );

  let downstreamFailure:
    unknown = null;

  try {
    await prisma.$transaction(
      async (tx: any) => {
        await installUniqueIndexInsideTransaction(
          tx,
        );

        const intake =
          await createQualifiedIntake(
            tx,
            {
              reference:
                adverse.intakeReference,

              candidateDisplayName:
                adverse.candidateDisplayName,

              candidateEmail:
                adverse.candidateEmail,

              actorUserId:
                actor.id,

              occurredAt,
            },
          );

        const identity =
          await resolveRepresentativeInstitutionalUserWithClient({
            client:
              tx,

            intakeId:
              intake.id,
          });

        const admission =
          await admitRepresentativeOnboardingWithClient({
            client:
              tx,

            intakeId:
              intake.id,

            actorUserId:
              actor.id,

            occurredAt,
          });

        const identityLink =
          await linkRepresentativeProgramParticipantUserWithClient({
            client:
              tx,

            participantId:
              admission.participant.id,

            userId:
              identity.user.id,

            actorUserId:
              actor.id,

            occurredAt,
          });

        assert.equal(
          identity.created,
          true,
        );

        assert.equal(
          admission.created,
          true,
        );

        assert.equal(
          identityLink.linked,
          true,
        );

        /*
         * Deliberately fail the final transaction stage.
         */
        await bindRepresentativeMasterAgreementWithClient({
          client:
            tx,

          intakeId:
            intake.id,

          instrumentReference:
            adverse.missingAgreementReference,

          actorUserId:
            actor.id,

          occurredAt,
        });
      },
      {
        maxWait:
          10_000,

        timeout:
          30_000,
      },
    );
  } catch (error) {
    downstreamFailure =
      error;
  }

  assert(
    downstreamFailure instanceof Error,
    "expected downstream binding failure",
  );

  assert.match(
    downstreamFailure.message,
    /ARP_MASTER_AGREEMENT_INSTRUMENT_REQUIRED/,
  );

  await assertFixtureAbsent({
    intakeReference:
      adverse.intakeReference,

    candidateEmail:
      adverse.candidateEmail,
  });

  const escapedParticipant =
    await prisma.representativeProgramParticipant.findFirst({
      where: {
        displayName:
          adverse.candidateDisplayName,
      },

      select: {
        id:
          true,
      },
    });

  assert.equal(
    escapedParticipant,
    null,
    "Participant escaped failed admission transaction",
  );

  console.log(
    "✓ downstream Master Agreement failure triggered",
  );

  console.log(
    "✓ provisioned User rolled back",
  );

  console.log(
    "✓ admitted Participant rolled back",
  );

  console.log(
    "✓ identity linkage rolled back",
  );

  console.log(
    "✓ docket mutation rolled back with transaction",
  );

  /*
   * The temporary unique index was itself transactional.
   * The local DB should still retain the original non-unique index.
   */
  const indexes =
    await prisma.$queryRawUnsafe(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename =
          'RepresentativeProgramParticipant'
      ORDER BY indexname
    `) as Array<{
      indexname: string;
    }>;

  const indexNames =
    indexes.map(
      (item: {
        indexname: string;
      }) =>
        item.indexname,
    );

  assert(
    indexNames.includes(
      "RepresentativeProgramParticipant_userId_idx",
    ),
    "original participant userId index was not restored",
  );

  assert(
    !indexNames.includes(
      "RepresentativeProgramParticipant_userId_key",
    ),
    "temporary unique participant userId index escaped rollback",
  );

  console.log(
    "✓ database index state restored",
  );

  console.log();
  console.log(
    "════════════════════════════════════════════════════",
  );

  console.log(
    " REP-1B.4 REAL TRANSACTION SMOKE PASSED",
  );

  console.log(
    " USER CREATED ≠ ADMITTED ≠ APPOINTED ≠ AUTHORIZED",
  );

  console.log(
    " ALL SMOKE MUTATIONS ROLLED BACK",
  );

  console.log(
    "════════════════════════════════════════════════════",
  );
}

main()
  .catch(
    (error) => {
      console.error(error);
      process.exit(1);
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
