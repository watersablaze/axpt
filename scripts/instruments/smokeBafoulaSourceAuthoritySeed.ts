import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  PrismaClient,
  type PrismaClient as PrismaClientType,
} from "@prisma/client";

import {
  BAFOULA_SOURCE_AUTHORITY_MANIFEST,
} from "../../src/domains/instruments/source-authority/seeds/bafoulaCanonicalManifest";

import {
  seedBafoulaSourceAuthorityWithClient,
  type BafoulaSourceAuthoritySeedClient,
} from "../../src/domains/instruments/source-authority/seeds/seedBafoulaSourceAuthorityWithClient";

type SeedTransactionClient =
  Pick<
    PrismaClientType,
    | "user"
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityRecord"
    | "sourceAuthorityProfileParticulars"
    | "sourceAuthorityAssertion"
    | "sourceAuthorityCapability"
    | "sourceAuthorityRecognition"
    | "sourceAuthorityRecognitionEvidence"
    | "instrumentEvidence"
    | "domainEvent"
  >;

type AssertionSnapshot =
  Readonly<{
    id: string;
    reference: string;
    assertionClass: string;
    title: string;
    statement: string;
    scope: string | null;
    ordinal: number;
    versionId: string;
    sourceAuthorityId: string;
  }>;

type CapabilitySnapshot =
  Readonly<{
    assertionId: string;
    capabilityKey: string;
    title: string;
    description: string;
  }>;

type EventSnapshot =
  Readonly<{
    eventType: string;
  }>;

async function main() {
  const prisma =
    new PrismaClient();

  const manifest =
    BAFOULA_SOURCE_AUTHORITY_MANIFEST;

  try {
    console.log(
      "── CREATE SEED OPERATOR ──",
    );

    const actorSuffix =
      randomUUID();

    const actor =
      await prisma.user.create({
        data: {
          username:
            `bafoula-sai-seed-operator-${actorSuffix}`,

          passwordHash:
            "SMOKE_ONLY_NOT_A_REAL_CREDENTIAL",

          email:
            `bafoula-sai-seed-${actorSuffix}@example.invalid`,

          isAdmin:
            true,

          viewedDocs:
            [],
        },
      });

    console.log(
      "✓ disposable seed operator created",
    );

    /*
     * ========================================================
     * FIRST COMMITTED SEED
     * ========================================================
     */

    console.log("");
    console.log(
      "── FIRST COMMITTED BAFOULA SEED ──",
    );

    const first =
      await prisma.$transaction(
        async (
          tx: SeedTransactionClient,
        ) => {
          return seedBafoulaSourceAuthorityWithClient({
            client:
              tx as BafoulaSourceAuthoritySeedClient,

            actorUserId:
              actor.id,
          });
        },
      );

    assert.equal(
      first.instrument.reference,
      "BAF-SAI-2026-001",
    );

    console.log(
      "✓ first canonical seed committed",
    );

    /*
     * ========================================================
     * SECOND COMMITTED SEED — IDEMPOTENCY
     * ========================================================
     */

    console.log("");
    console.log(
      "── SECOND COMMITTED BAFOULA SEED ──",
    );

    const second =
      await prisma.$transaction(
        async (
          tx: SeedTransactionClient,
        ) => {
          return seedBafoulaSourceAuthorityWithClient({
            client:
              tx as BafoulaSourceAuthoritySeedClient,

            actorUserId:
              actor.id,
          });
        },
      );

    assert.equal(
      second.instrument.id,
      first.instrument.id,
      "SECOND_SEED_MUST_RETURN_SAME_INSTRUMENT",
    );

    assert.equal(
      second.sourceAuthority.id,
      first.sourceAuthority.id,
      "SECOND_SEED_MUST_RETURN_SAME_SOURCE_AUTHORITY_RECORD",
    );

    assert.equal(
      second.profileParticulars.id,
      first.profileParticulars.id,
      "SECOND_SEED_MUST_RETURN_SAME_PROFILE_PARTICULARS_RECORD",
    );

    console.log(
      "✓ second seed resolved to same canonical instrument and profile particulars",
    );

    /*
     * ========================================================
     * EXACT ROOT GRAPH
     * ========================================================
     */

    console.log("");
    console.log(
      "── VERIFY CANONICAL ROOT GRAPH ──",
    );

    const instruments =
      await prisma
        .institutionalInstrument
        .findMany({
          where: {
            reference:
              manifest.instrument.reference,
          },
        });

    assert.equal(
      instruments.length,
      1,
      "BAFOULA_INSTRUMENT_CARDINALITY_MUST_BE_ONE",
    );

    const instrument =
      instruments[0];

    assert.equal(
      instrument.title,
      manifest.instrument.title,
    );

    assert.equal(
      instrument.kind,
      "SOURCE_AUTHORITY",
    );

    const versions =
      await prisma
        .instrumentVersion
        .findMany({
          where: {
            instrumentId:
              instrument.id,
          },
        });

    assert.equal(
      versions.length,
      1,
      "BAFOULA_VERSION_CARDINALITY_MUST_BE_ONE",
    );

    assert.equal(
      versions[0].number,
      1,
    );

    const root =
      await prisma
        .sourceAuthorityRecord
        .findUnique({
          where: {
            instrumentId:
              instrument.id,
          },
        });

    assert.ok(
      root,
      "BAFOULA_SOURCE_AUTHORITY_ROOT_MISSING",
    );

    assert.equal(
      root.subjectDisplayName,
      manifest.subject.displayName,
    );

    assert.equal(
      root.jurisdiction,
      manifest.subject.jurisdiction,
    );

    assert.equal(
      root.institutionalCapacity,
      manifest.subject.institutionalCapacity,
    );

    assert.equal(
      root.operatingBase,
      manifest.subject.operatingBase,
    );

    assert.equal(
      root.sector,
      manifest.subject.sector,
    );

    assert.deepEqual(
      root.principalCommodityActivity,
      [
        "Gold",
        "Gold Doré",
      ],
    );

    console.log(
      "✓ canonical root graph exact",
    );

    /*
     * ========================================================
     * VERSION-BOUND SOURCE PROFILE PARTICULARS
     * ========================================================
     */

    console.log("");
    console.log(
      "── VERIFY VERSION-BOUND SOURCE PROFILE PARTICULARS ──",
    );

    const particulars =
      await prisma
        .sourceAuthorityProfileParticulars
        .findMany({
          where: {
            sourceAuthorityId:
              root.id,

            versionId:
              versions[0].id,
          },
        });

    assert.equal(
      particulars.length,
      1,
      "BAFOULA_PROFILE_PARTICULARS_CARDINALITY_MUST_BE_ONE",
    );

    const profileParticulars =
      particulars[0];

    assert.equal(
      profileParticulars.id,
      first.profileParticulars.id,
      "BAFOULA_PROFILE_PARTICULARS_SEED_RESULT_MUST_MATCH_PERSISTENCE",
    );

    assert.equal(
      profileParticulars.sourceAuthorityId,
      root.id,
    );

    assert.equal(
      profileParticulars.versionId,
      versions[0].id,
    );

    assert.equal(
      profileParticulars.documentReference,
      manifest.sourceProfile.documentReference,
    );

    assert.equal(
      profileParticulars.documentVersion,
      manifest.sourceProfile.version,
    );

    assert.equal(
      profileParticulars.documentStatus,
      manifest.sourceProfile.status,
    );

    assert.equal(
      profileParticulars.registrationReference,
      null,
      "BAFOULA_REGISTRATION_REFERENCE_MUST_REMAIN_UNRESOLVED",
    );

    assert.equal(
      profileParticulars.registrationStanding,
      manifest.sourceProfile.registrationStanding,
    );

    assert.equal(
      profileParticulars.registeredAddress,
      manifest.sourceProfile.registeredAddress,
    );

    assert.equal(
      profileParticulars.authorizedRepresentativeName,
      manifest.sourceProfile.authorizedRepresentativeName,
    );

    assert.equal(
      profileParticulars.authorizedRepresentativeCapacity,
      manifest.sourceProfile.authorizedRepresentativeCapacity,
    );

    assert.equal(
      profileParticulars.officialContact,
      manifest.sourceProfile.officialContact,
    );

    console.log(
      "✓ one exact version-bound Source Profile particulars record persisted",
    );

    /*
     * ========================================================
     * ASSERTIONS
     * ========================================================
     */

    console.log("");
    console.log(
      "── VERIFY SIX CANONICAL ASSERTIONS ──",
    );

    const assertions =
      (
        await prisma
          .sourceAuthorityAssertion
          .findMany({
            where: {
              sourceAuthorityId:
                root.id,
            },

            orderBy: {
              ordinal:
                "asc",
            },
          })
      ) as readonly AssertionSnapshot[];

    assert.equal(
      assertions.length,
      6,
      "BAFOULA_ASSERTION_CARDINALITY_MUST_BE_SIX",
    );

    assert.deepEqual(
      assertions.map(
        (assertion) =>
          assertion.reference,
      ),
      [
        "A001",
        "A002",
        "A003",
        "A004",
        "A005",
        "A006",
      ],
    );

    for (
      const expected
      of manifest.assertions
    ) {
      const actual =
        assertions.find(
          (assertion) =>
            assertion.reference ===
            expected.reference,
        );

      assert.ok(
        actual,
        `MISSING_ASSERTION_${expected.reference}`,
      );

      assert.equal(
        actual.assertionClass,
        expected.assertionClass,
      );

      assert.equal(
        actual.title,
        expected.title,
      );

      assert.equal(
        actual.statement,
        expected.statement,
      );

      assert.equal(
        actual.scope,
        expected.scope,
      );

      assert.equal(
        actual.ordinal,
        expected.ordinal,
      );

      assert.equal(
        actual.versionId,
        versions[0].id,
      );

      assert.equal(
        actual.sourceAuthorityId,
        root.id,
      );
    }

    console.log(
      "✓ six canonical assertions persisted exactly once",
    );

    /*
     * ========================================================
     * CAPABILITIES
     * ========================================================
     */

    console.log("");
    console.log(
      "── VERIFY SIX A003 CAPABILITIES ──",
    );

    const a003 =
      assertions.find(
        (assertion) =>
          assertion.reference ===
          "A003",
      );

    assert.ok(
      a003,
      "A003_MISSING",
    );

    const capabilities =
      (
        await prisma
          .sourceAuthorityCapability
          .findMany({
            where: {
              assertionId:
                a003.id,
            },

            orderBy: {
              capabilityKey:
                "asc",
            },
          })
      ) as readonly CapabilitySnapshot[];

    assert.equal(
      capabilities.length,
      6,
      "BAFOULA_CAPABILITY_CARDINALITY_MUST_BE_SIX",
    );

    const actualCapabilityKeys =
      capabilities
        .map(
          (capability) =>
            capability.capabilityKey,
        )
        .sort();

    const expectedCapabilityKeys =
      manifest.capabilities
        .map(
          (capability) =>
            capability.capabilityKey,
        )
        .sort();

    assert.deepEqual(
      actualCapabilityKeys,
      expectedCapabilityKeys,
    );

    for (
      const expected
      of manifest.capabilities
    ) {
      const actual =
        capabilities.find(
          (capability) =>
            capability.capabilityKey ===
            expected.capabilityKey,
        );

      assert.ok(
        actual,
        `MISSING_CAPABILITY_${expected.capabilityKey}`,
      );

      assert.equal(
        actual.assertionId,
        a003.id,
      );

      assert.equal(
        actual.title,
        expected.title,
      );

      assert.equal(
        actual.description,
        expected.description,
      );
    }

    const capabilitiesOutsideA003 =
      await prisma
        .sourceAuthorityCapability
        .count({
          where: {
            assertion: {
              sourceAuthorityId:
                root.id,

              NOT: {
                reference:
                  "A003",
              },
            },
          },
        });

    assert.equal(
      capabilitiesOutsideA003,
      0,
      "CAPABILITIES_MUST_REMAIN_SCOPED_TO_A003",
    );

    console.log(
      "✓ six capabilities persisted exactly under A003",
    );

    /*
     * ========================================================
     * NO RECOGNITION / NO EVIDENCE LINKAGE
     * ========================================================
     */

    console.log("");
    console.log(
      "── VERIFY UNREVIEWED STARTING STATE ──",
    );

    const assertionIds =
      assertions.map(
        (assertion) =>
          assertion.id,
      );

    const recognitionCount =
      await prisma
        .sourceAuthorityRecognition
        .count({
          where: {
            assertionId: {
              in:
                assertionIds,
            },
          },
        });

    assert.equal(
      recognitionCount,
      0,
      "CANONICAL_SEED_MUST_NOT_CREATE_RECOGNITIONS",
    );

    const recognitionEvidenceCount =
      await prisma
        .sourceAuthorityRecognitionEvidence
        .count({
          where: {
            recognition: {
              assertionId: {
                in:
                  assertionIds,
              },
            },
          },
        });

    assert.equal(
      recognitionEvidenceCount,
      0,
      "CANONICAL_SEED_MUST_NOT_CREATE_RECOGNITION_EVIDENCE",
    );

    const instrumentEvidenceCount =
      await prisma
        .instrumentEvidence
        .count({
          where: {
            instrumentId:
              instrument.id,
          },
        });

    assert.equal(
      instrumentEvidenceCount,
      0,
      "SAI_2A_MUST_NOT_ATTACH_EVIDENCE_YET",
    );

    console.log(
      "✓ recognition count = 0",
    );

    console.log(
      "✓ recognition-evidence count = 0",
    );

    console.log(
      "✓ instrument-evidence count = 0",
    );

    /*
     * ========================================================
     * EVENT IDEMPOTENCY
     * ========================================================
     */

    console.log("");
    console.log(
      "── VERIFY SOURCE AUTHORITY EVENT IDEMPOTENCY ──",
    );

    const sourceAuthorityEvents =
      (
        await prisma.domainEvent.findMany({
          where: {
            streamId:
              instrument.id,

            eventType: {
              in: [
                "SOURCE_AUTHORITY_ESTABLISHED",
                "SOURCE_AUTHORITY_ASSERTION_RECORDED",
                "SOURCE_AUTHORITY_CAPABILITY_RECORDED",
              ],
            },
          },
        })
      ) as readonly EventSnapshot[];

    const establishedCount =
      sourceAuthorityEvents.filter(
        (event) =>
          event.eventType ===
          "SOURCE_AUTHORITY_ESTABLISHED",
      ).length;

    const assertionEventCount =
      sourceAuthorityEvents.filter(
        (event) =>
          event.eventType ===
          "SOURCE_AUTHORITY_ASSERTION_RECORDED",
      ).length;

    const capabilityEventCount =
      sourceAuthorityEvents.filter(
        (event) =>
          event.eventType ===
          "SOURCE_AUTHORITY_CAPABILITY_RECORDED",
      ).length;

    assert.equal(
      establishedCount,
      1,
      "SOURCE_AUTHORITY_ESTABLISHED_EVENT_MUST_BE_IDEMPOTENT",
    );

    assert.equal(
      assertionEventCount,
      6,
      "ASSERTION_EVENTS_MUST_BE_IDEMPOTENT",
    );

    assert.equal(
      capabilityEventCount,
      6,
      "CAPABILITY_EVENTS_MUST_BE_IDEMPOTENT",
    );

    assert.equal(
      sourceAuthorityEvents.length,
      13,
      "SOURCE_AUTHORITY_EVENT_TOTAL_MUST_BE_THIRTEEN",
    );

    console.log(
      "✓ event history remained singular after second seed",
    );

    /*
     * ========================================================
     * REGISTRATION REFERENCE MUST REMAIN ABSENT
     * ========================================================
     */

    console.log("");
    console.log(
      "── VERIFY NO INVENTED REGISTRATION REFERENCE ──",
    );

    assert.equal(
      manifest.sourceProfile.registrationReference,
      null,
    );

    assert.equal(
      manifest.sourceProfile.registrationStanding,
      "PENDING_DOCUMENTARY_COMPLETION",
    );

    console.log(
      "✓ registration reference remains unresolved",
    );

    console.log("");
    console.log(
      "✓ Bafoula canonical Source Authority seed smoke passed",
    );

    console.log({
      instrumentReference:
        instrument.reference,

      versions:
        versions.length,

      sourceAuthorityRoots:
        1,

      assertions:
        assertions.length,

      capabilities:
        capabilities.length,

      recognitions:
        recognitionCount,

      recognitionEvidenceLinks:
        recognitionEvidenceCount,

      instrumentEvidence:
        instrumentEvidenceCount,

      sourceAuthorityEvents:
        sourceAuthorityEvents.length,

      secondSeedWasIdempotent:
        true,

      registrationReferenceInvented:
        false,

      transactionAuthorityConferred:
        false,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
