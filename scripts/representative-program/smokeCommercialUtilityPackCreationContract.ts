import assert from "node:assert/strict";

import {
  createCommercialUtilityPackWithClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/commands/createCommercialUtilityPackWithClient";

import {
  COMMERCIAL_UTILITY_PACK_MODULES,
  createCommercialUtilityPackReference,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/contracts";

type Pack = {
  id: string;
  reference: string;
  participantId: string;
  version: number;
  state: string;
  releaseState: string;
  audience: string;
  createdByUserId: string;
  modules: Array<{
    module: string;
    state: string;
  }>;
};

const state = {
  admin: true,
  standing: "PROVISIONAL",
  pack: null as Pack | null,
  events: [] as Array<Record<string, unknown>>,
  creates: 0,
};

const participant = {
  id: "participant-cup-smoke",
  docketReference:
    "FWI-26-RP-001",
  standing:
    state.standing,
};

const client = {
  user: {
    findUnique: async () => ({
      isAdmin:
        state.admin,
    }),
  },

  representativeProgramParticipant: {
    findUnique: async () => ({
      ...participant,
      standing:
        state.standing,
    }),
  },

  commercialUtilityPack: {
    findUnique: async (
      args: {
        where:
          | {
              participantId_version: {
                participantId: string;
                version: number;
              };
            }
          | {
              reference: string;
            };
      },
    ) => {
      if (!state.pack) {
        return null;
      }

      if (
        "participantId_version" in
        args.where
      ) {
        const key =
          args.where
            .participantId_version;

        return (
          state.pack.participantId ===
            key.participantId &&
          state.pack.version ===
            key.version
        )
          ? state.pack
          : null;
      }

      return (
        state.pack.reference ===
        args.where.reference
      )
        ? {
            id:
              state.pack.id,
            participantId:
              state.pack.participantId,
            version:
              state.pack.version,
          }
        : null;
    },

    create: async (
      args: {
        data: {
          reference: string;
          participantId: string;
          version: number;
          state: string;
          releaseState: string;
          audience: string;
          createdByUserId: string;
          modules: {
            create: Array<{
              module: string;
              state: string;
            }>;
          };
        };
      },
    ) => {
      state.creates += 1;

      state.pack = {
        id:
          "cup-smoke-001",
        reference:
          args.data.reference,
        participantId:
          args.data.participantId,
        version:
          args.data.version,
        state:
          args.data.state,
        releaseState:
          args.data.releaseState,
        audience:
          args.data.audience,
        createdByUserId:
          args.data.createdByUserId,
        modules:
          args.data.modules.create,
      };

      return state.pack;
    },
  },

  domainEvent: {
    create: async (
      args: {
        data:
          Record<string, unknown>;
      },
    ) => {
      state.events.push(
        args.data,
      );

      return args.data;
    },
  },
};

async function main() {
  assert.equal(
    createCommercialUtilityPackReference({
      docketReference:
        "FWI-26-RP-001",
      version: 1,
    }),
    "FWI-26-RP-001-CUP-001",
  );

  const first =
    await createCommercialUtilityPackWithClient({
      client:
        client as never,
      participantId:
        participant.id,
      actorUserId:
        "admin-cup-smoke",
      occurredAt:
        new Date(
          "2026-10-05T13:30:00.000Z",
        ),
    });

  assert.equal(
    first.created,
    true,
  );

  assert.equal(
    first.reference,
    "FWI-26-RP-001-CUP-001",
  );

  assert.equal(
    state.creates,
    1,
  );

  assert.equal(
    state.pack?.state,
    "PREPARING",
  );

  assert.equal(
    state.pack?.releaseState,
    "WITHHELD",
  );

  assert.equal(
    state.pack?.audience,
    "REPRESENTATIVE",
  );

  assert.deepEqual(
    state.pack?.modules.map(
      (entry) =>
        entry.module,
    ),
    [...COMMERCIAL_UTILITY_PACK_MODULES],
  );

  assert.ok(
    state.pack?.modules.every(
      (entry) =>
        entry.state ===
        "WITHHELD",
    ),
  );

  assert.equal(
    state.events.length,
    1,
  );

  assert.equal(
    state.events[0]?.eventType,
    "COMMERCIAL_UTILITY_PACK_CREATED",
  );

  const replay =
    await createCommercialUtilityPackWithClient({
      client:
        client as never,
      participantId:
        participant.id,
      actorUserId:
        "admin-cup-smoke",
      occurredAt:
        new Date(
          "2026-10-05T13:31:00.000Z",
        ),
    });

  assert.equal(
    replay.created,
    false,
  );

  assert.equal(
    replay.package.id,
    first.package.id,
  );

  assert.equal(
    state.creates,
    1,
  );

  assert.equal(
    state.events.length,
    1,
  );

  state.admin = false;

  await assert.rejects(
    () =>
      createCommercialUtilityPackWithClient({
        client:
          client as never,
        participantId:
          "another-participant",
        actorUserId:
          "non-admin",
      }),
    /CUP_CREATION_ADMIN_REQUIRED/,
  );

  state.admin = true;

  if (!state.pack) {
    throw new Error(
      "smoke pack unexpectedly absent",
    );
  }

  const originalModules =
    state.pack.modules;

  state.pack.modules = [
    {
      module:
        "REPRESENTATION",
      state:
        "WITHHELD",
    },
  ];

  await assert.rejects(
    () =>
      createCommercialUtilityPackWithClient({
        client:
          client as never,
        participantId:
          participant.id,
        actorUserId:
          "admin-cup-smoke",
      }),
    /CUP_MODULE_REGISTRY_CONTRADICTION/,
  );

  state.pack.modules =
    originalModules;

  console.log(
    "✓ deterministic CUP reference",
  );

  console.log(
    "✓ creation requires administrative actor",
  );

  console.log(
    "✓ package starts PREPARING / WITHHELD",
  );

  console.log(
    "✓ exactly four WITHHELD modules created",
  );

  console.log(
    "✓ creation event recorded once",
  );

  console.log(
    "✓ exact replay returns existing package without duplicate event",
  );

  console.log(
    "✓ malformed module registry rejected",
  );

  console.log(
    "CUP_1C_CREATION_CONTRACT_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
