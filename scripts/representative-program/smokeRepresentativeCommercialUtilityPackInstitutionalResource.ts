import assert from "node:assert/strict";

import {
  loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient as load,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient";

function pack(
  resourceId: string,
  releaseId: string,
) {
  return {
    participantId: "participant-a",
    reference: "FWI-26-RP-001-CUP-001",
    version: 1,
    audience: "REPRESENTATIVE",
    state: "PREPARING",
    releaseState: "PARTIAL",

    modules: [
      { module: "REPRESENTATION", state: "READY" },
      { module: "COMMERCIAL_PARAMETERS", state: "READY" },
      { module: "DOCUMENTS", state: "RELEASED" },
      { module: "OPERATING_BOUNDARIES", state: "READY" },
    ],

    resources: [
      {
        id: releaseId,
        module: "DOCUMENTS",
        resourceType: "INSTITUTIONAL_INSTRUMENT",
        resourceId,
        label: "Institutional Resource",
        state: "RELEASED",
        canView: true,
        canDownload: false,
        canPresent: false,
        canTransmit: false,
      },
    ],
  };
}

function baseClient(
  packageState: any,
  instrumentLookup: (query: any) => any,
) {
  return {
    representativeProgramParticipant: {
      async findMany(query: any) {
        assert.deepEqual(
          query.where,
          { userId: "user-a" },
        );

        return [
          { id: "participant-a" },
        ];
      },
    },

    commercialUtilityPack: {
      async findUnique(query: any) {
        assert.deepEqual(
          query.where,
          {
            participantId_version: {
              participantId: "participant-a",
              version: 1,
            },
          },
        );

        return packageState;
      },
    },

    institutionalInstrument: {
      findUnique:
        instrumentLookup,
    },

    instrumentVersion: {
      async findUnique() {
        return {
          id: "version-1",
          number: 1,
        };
      },
    },

    sourceAuthorityRecord: {
      async findUnique() {
        return {
          id: "source-authority-1",
          instrumentId: "sai-1",

          subjectDisplayName:
            "Coopérative de Bafoula",

          jurisdiction:
            "Republic of Mali",

          institutionalCapacity:
            "Malian Cooperative · Source Authority",

          operatingBase:
            "Bamako, Republic of Mali",

          sector:
            "Minerals and Natural Resources",

          principalCommodityActivity: [
            "Gold",
            "Gold Doré",
          ],

          assertions: [],
          evidenceAdmissions: [],
        };
      },
    },

    sourceAuthorityProfileParticulars: {
      async findUnique() {
        return {
          documentReference:
            "BAF-PROFILE-MALI-2026-002",

          documentVersion:
            "v4 · 2026",

          documentStatus:
            "External Reference",

          registrationReference:
            null,

          registrationStanding:
            "PENDING_DOCUMENTARY_COMPLETION",

          registeredAddress:
            null,

          authorizedRepresentativeName:
            null,

          authorizedRepresentativeCapacity:
            null,

          officialContact:
            null,
        };
      },
    },
  } as any;
}

async function main() {
  /*
   * 1. REPRESENTATIVE MASTER AGREEMENT
   */
  {
    const client =
      baseClient(
        pack(
          "agreement-1",
          "release-agreement",
        ),

        async ({ where }: any) => {
          assert.equal(
            where.id,
            "agreement-1",
          );

          return {
            id: "agreement-1",
            reference:
              "FWI-26-RP-001-MA",
            kind:
              "REPRESENTATIVE_PROGRAM_AGREEMENT",
          };
        },
      );

    const result =
      await load({
        client,
        userId: "user-a",
        resourceReleaseId:
          "release-agreement",
      });

    assert.ok(result);

    assert.equal(
      result.kind,
      "REPRESENTATIVE_PROGRAM_AGREEMENT",
    );

    console.log(
      "✓ Master Agreement dispatch preserved",
    );
  }

  /*
   * 2. BAF SOURCE AUTHORITY
   */
  {
    const client =
      baseClient(
        pack(
          "sai-1",
          "release-sai",
        ),

        async ({ where }: any) => {
          if (where.id === "sai-1") {
            return {
              id: "sai-1",
              reference:
                "BAF-SAI-2026-001",
              kind:
                "SOURCE_AUTHORITY",
            };
          }

          if (
            where.reference ===
            "BAF-SAI-2026-001"
          ) {
            return {
              id: "sai-1",
              reference:
                "BAF-SAI-2026-001",
              kind:
                "SOURCE_AUTHORITY",

              title:
                "COOPÉRATIVE DE BAFOULA — SOURCE AUTHORITY INSTRUMENT",

              currentVersion:
                1,
            };
          }

          return null;
        },
      );

    const result =
      await load({
        client,
        userId: "user-a",
        resourceReleaseId:
          "release-sai",
      });

    assert.ok(result);

    assert.equal(
      result.kind,
      "SOURCE_AUTHORITY",
    );

    if (
      result.kind !==
      "SOURCE_AUTHORITY"
    ) {
      throw new Error(
        "SOURCE_AUTHORITY_REQUIRED",
      );
    }

    assert.equal(
      result.presentation.audience,
      "REPRESENTATIVE",
    );

    assert.equal(
      result.presentation.identity
        .instrumentReference,
      "BAF-SAI-2026-001",
    );

    assert.equal(
      result.presentation.identity
        .instrumentId,
      "sai-1",
    );

    assert.equal(
      result.presentation.boundary
        .transactionAuthorityConferred,
      false,
    );

    assert.equal(
      result.presentation.boundary
        .settlementAuthorityConferred,
      false,
    );

    console.log(
      "✓ BAF SAI returns REPRESENTATIVE projection",
    );

    console.log(
      "✓ SAI authority boundary remains non-conferential",
    );
  }

  /*
   * 3. UNSUPPORTED INSTITUTION KIND
   */
  {
    const client =
      baseClient(
        pack(
          "unsupported-1",
          "release-unsupported",
        ),

        async ({ where }: any) => {
          assert.equal(
            where.id,
            "unsupported-1",
          );

          return {
            id: "unsupported-1",
            reference:
              "GM-TEST-001",
            kind:
              "GLOBAL_MOTHER_FRAMEWORK",
          };
        },
      );

    const result =
      await load({
        client,
        userId: "user-a",
        resourceReleaseId:
          "release-unsupported",
      });

    assert.equal(
      result,
      null,
    );

    console.log(
      "✓ unsupported institutional kind fails closed",
    );
  }

  console.log();
  console.log(
    "JENS_V1_INSTITUTIONAL_RESOURCE_DISPATCH_OK",
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
