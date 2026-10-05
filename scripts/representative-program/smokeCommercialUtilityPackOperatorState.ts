import assert from "node:assert/strict";

import {
  loadCommercialUtilityPackOperatorState,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

function buildPack() {
  return {
    id:
      "cup-operator-state-001",

    reference:
      "FWI-26-RP-001-CUP-001",

    participantId:
      "participant-1",

    version:
      1,

    state:
      "PREPARING",

    releaseState:
      "PARTIAL",

    audience:
      "REPRESENTATIVE",

    releasedByUserId:
      null,

    releasedAt:
      null,

    modules: [
      {
        module:
          "REPRESENTATION",

        state:
          "RELEASED",

        releasedByUserId:
          "admin-1",

        releasedAt:
          new Date(
            "2026-10-05T20:00:00.000Z",
          ),
      },

      {
        module:
          "COMMERCIAL_PARAMETERS",

        state:
          "WITHHELD",

        releasedByUserId:
          null,

        releasedAt:
          null,
      },

      {
        module:
          "DOCUMENTS",

        state:
          "READY",

        releasedByUserId:
          null,

        releasedAt:
          null,
      },

      {
        module:
          "OPERATING_BOUNDARIES",

        state:
          "READY",

        releasedByUserId:
          null,

        releasedAt:
          null,
      },
    ],

    resources: [
      {
        id:
          "resource-profile",

        module:
          "REPRESENTATION",

        resourceType:
          "STRUCTURED_CONTENT",

        resourceId:
          "FW-PROFILE-2026-001",

        label:
          "French-Ward Institutional Profile",

        state:
          "RELEASED",

        canView:
          true,

        canDownload:
          false,

        canPresent:
          false,

        canTransmit:
          false,

        releasedByUserId:
          "admin-1",

        releasedAt:
          new Date(
            "2026-10-05T20:00:00.000Z",
          ),
      },

      {
        id:
          "resource-agreement",

        module:
          "DOCUMENTS",

        resourceType:
          "INSTITUTIONAL_INSTRUMENT",

        resourceId:
          "agreement-1",

        label:
          "Representative Program Master Agreement",

        state:
          "WITHHELD",

        canView:
          true,

        canDownload:
          false,

        canPresent:
          false,

        canTransmit:
          false,

        releasedByUserId:
          null,

        releasedAt:
          null,
      },
    ],
  };
}

async function main() {
  let mutationCount =
    0;

  const pack =
    buildPack();

  const client = {
    commercialUtilityPack: {
      async findUnique(
        args:
          any,
      ) {
        assert.deepEqual(
          args.where,
          {
            participantId_version: {
              participantId:
                "participant-1",

              version:
                1,
            },
          },
        );

        assert.deepEqual(
          args.select.resources.where.state.in,
          [
            "WITHHELD",
            "RELEASED",
          ],
        );

        return structuredClone(
          pack,
        );
      },

      async create() {
        mutationCount +=
          1;

        throw new Error(
          "unexpected mutation",
        );
      },

      async update() {
        mutationCount +=
          1;

        throw new Error(
          "unexpected mutation",
        );
      },

      async updateMany() {
        mutationCount +=
          1;

        throw new Error(
          "unexpected mutation",
        );
      },
    },
  };

  const state =
    await loadCommercialUtilityPackOperatorState({
      client:
        client as never,

      participantId:
        "participant-1",
    });

  assert.ok(
    state,
  );

  assert.equal(
    state.reference,
    "FWI-26-RP-001-CUP-001",
  );

  assert.equal(
    state.state,
    "PREPARING",
  );

  assert.equal(
    state.releaseState,
    "PARTIAL",
  );

  assert.equal(
    state.modules.length,
    4,
  );

  assert.equal(
    state.modules.find(
      (entry) =>
        entry.module ===
        "REPRESENTATION",
    )?.state,
    "RELEASED",
  );

  assert.equal(
    state.modules.find(
      (entry) =>
        entry.module ===
        "DOCUMENTS",
    )?.state,
    "READY",
  );

  const documents =
    state.modules.find(
      (entry) =>
        entry.module ===
        "DOCUMENTS",
    );

  assert.equal(
    documents?.currentResources.length,
    1,
  );

  assert.equal(
    documents?.currentResources[0]
      .canView,
    true,
  );

  assert.equal(
    documents?.currentResources[0]
      .canDownload,
    false,
  );

  assert.equal(
    documents?.currentResources[0]
      .canPresent,
    false,
  );

  assert.equal(
    documents?.currentResources[0]
      .canTransmit,
    false,
  );

  assert.equal(
    mutationCount,
    0,
  );

  const absent =
    await loadCommercialUtilityPackOperatorState({
      client: {
        commercialUtilityPack: {
          async findUnique() {
            return null;
          },
        },
      } as never,

      participantId:
        "participant-absent",
    });

  assert.equal(
    absent,
    null,
  );

  const contradictory = {
    ...buildPack(),

    modules:
      buildPack()
        .modules
        .slice(
          0,
          3,
        ),
  };

  await assert.rejects(
    () =>
      loadCommercialUtilityPackOperatorState({
        client: {
          commercialUtilityPack: {
            async findUnique() {
              return contradictory;
            },
          },
        } as never,

        participantId:
          "participant-1",
      }),

    /CUP_OPERATOR_STATE_MODULE_REGISTRY_CONTRADICTION/,
  );

  console.log(
    "✓ operator state reloads canonical CUP by participant + version",
  );

  console.log(
    "✓ package state and release state are durable",
  );

  console.log(
    "✓ all four canonical module states are projected",
  );

  console.log(
    "✓ only current WITHHELD / RELEASED resources are projected",
  );

  console.log(
    "✓ resource permissions are visible without mutation",
  );

  console.log(
    "✓ absent CUP resolves null rather than manufacturing package state",
  );

  console.log(
    "✓ malformed module registry is rejected as contradiction",
  );

  console.log(
    "✓ operator read model performs no mutation",
  );

  console.log(
    "CUP_1G_OPERATOR_STATE_OK",
  );
}

main().catch(
  (error) => {
    console.error(
      error,
    );

    process.exit(
      1,
    );
  },
);
