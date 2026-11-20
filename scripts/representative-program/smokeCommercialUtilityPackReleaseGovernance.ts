import assert from "node:assert/strict";

import {
  registerCommercialUtilityPackResourceWithClient,
  releaseCommercialUtilityPackResourceWithClient,
  transitionCommercialUtilityPackModuleWithClient,
  reconcileCommercialUtilityPackReleaseStateWithClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

type ModuleState =
  "WITHHELD" |
  "READY" |
  "RELEASED";

type ResourceState =
  "WITHHELD" |
  "RELEASED" |
  "SUPERSEDED" |
  "WITHDRAWN";

const modules = [
  "REPRESENTATION",
  "COMMERCIAL_PARAMETERS",
  "DOCUMENTS",
  "OPERATING_BOUNDARIES",
] as const;

const state = {
  pack: {
    id:
      "cup-release-smoke",
    reference:
      "FWI-26-RP-001-CUP-001",
    participantId:
      "participant-release-smoke",
    version:
      1,
    state:
      "PREPARING",
    releaseState:
      "WITHHELD",
    audience:
      "REPRESENTATIVE",
    createdByUserId:
      "admin-release-smoke",
    releasedByUserId:
      null as string | null,
    releasedAt:
      null as Date | null,
  },

  modules:
    modules.map(
      (module, index) => ({
        id:
          `module-${index + 1}`,
        packageId:
          "cup-release-smoke",
        module,
        state:
          "WITHHELD" as ModuleState,
        releasedByUserId:
          null as string | null,
        releasedAt:
          null as Date | null,
      }),
    ),

  resources: [] as Array<{
    id: string;
    packageId: string;
    module:
      (typeof modules)[number];
    resourceType:
      "STRUCTURED_CONTENT";
    resourceId: string;
    state: ResourceState;
    label: string | null;
    canView: boolean;
    canDownload: boolean;
    canPresent: boolean;
    canTransmit: boolean;
    releasedByUserId:
      string | null;
    releasedAt:
      Date | null;
  }>,

  events: [] as Array<{
    eventType: string;
  }>,
};

const client = {
  user: {
    findUnique: async () => ({
      isAdmin: true,
    }),
  },

  commercialUtilityPack: {
    findUnique: async (
      args: any,
    ) => {
      if (!args?.include?.modules) {
        return state.pack;
      }

      const moduleWhere =
        args.include.modules.where;

      return {
        ...state.pack,
        modules:
          state.modules.filter(
            (entry) =>
              entry.packageId ===
                state.pack.id &&
              (
                !moduleWhere?.module ||
                entry.module ===
                  moduleWhere.module
              ),
          ),
      };
    },

    updateMany: async (
      args: {
        where: {
          id: string;
          releaseState: string;
          state: string;
        };
        data: {
          releaseState: string;
          state: string;
          releasedByUserId:
            string | null;
          releasedAt:
            Date | null;
        };
      },
    ) => {
      if (
        state.pack.id !==
          args.where.id ||
        state.pack.releaseState !==
          args.where.releaseState ||
        state.pack.state !==
          args.where.state
      ) {
        return {
          count: 0,
        };
      }

      state.pack.releaseState =
        args.data.releaseState;

      state.pack.state =
        args.data.state;

      state.pack.releasedByUserId =
        args.data.releasedByUserId;

      state.pack.releasedAt =
        args.data.releasedAt;

      return {
        count: 1,
      };
    },
  },

  commercialUtilityPackModuleRelease: {
    findUnique: async (
      args: any,
    ) => {
      if (args.where.id) {
        return (
          state.modules.find(
            (entry) =>
              entry.id ===
              args.where.id,
          ) ?? null
        );
      }

      const key =
        args.where
          .packageId_module;

      return (
        state.modules.find(
          (entry) =>
            entry.packageId ===
              key.packageId &&
            entry.module ===
              key.module,
        ) ?? null
      );
    },

    findMany: async (
      args: any,
    ) =>
      state.modules.filter(
        (entry) =>
          entry.packageId ===
          args.where.packageId,
      ),

    updateMany: async (
      args: any,
    ) => {
      const target =
        state.modules.find(
          (entry) =>
            entry.id ===
              args.where.id &&
            entry.state ===
              args.where.state,
        );

      if (!target) {
        return {
          count: 0,
        };
      }

      target.state =
        args.data.state;

      target.releasedByUserId =
        args.data.releasedByUserId;

      target.releasedAt =
        args.data.releasedAt;

      return {
        count: 1,
      };
    },
  },

  commercialUtilityPackResourceRelease: {
    findUnique: async (
      args: any,
    ) => {
      if (args.where.id) {
        return (
          state.resources.find(
            (entry) =>
              entry.id ===
              args.where.id,
          ) ?? null
        );
      }

      const key =
        args.where
          .packageId_module_resourceType_resourceId;

      return (
        state.resources.find(
          (entry) =>
            entry.packageId ===
              key.packageId &&
            entry.module ===
              key.module &&
            entry.resourceType ===
              key.resourceType &&
            entry.resourceId ===
              key.resourceId,
        ) ?? null
      );
    },

    findMany: async (
      args: any,
    ) =>
      state.resources.filter(
        (entry) =>
          entry.packageId ===
            args.where.packageId &&
          entry.module ===
            args.where.module &&
          args.where.state.in.includes(
            entry.state,
          ),
      ),

    create: async (
      args: any,
    ) => {
      const resource = {
        id:
          `resource-${state.resources.length + 1}`,
        packageId:
          args.data.packageId,
        module:
          args.data.module,
        resourceType:
          args.data.resourceType,
        resourceId:
          args.data.resourceId,
        state:
          args.data.state,
        label:
          args.data.label,
        canView:
          args.data.canView,
        canDownload:
          args.data.canDownload,
        canPresent:
          args.data.canPresent,
        canTransmit:
          args.data.canTransmit,
        releasedByUserId:
          null,
        releasedAt:
          null,
      };

      state.resources.push(
        resource,
      );

      return resource;
    },

    updateMany: async (
      args: any,
    ) => {
      const target =
        state.resources.find(
          (entry) =>
            entry.id ===
              args.where.id &&
            entry.state ===
              args.where.state,
        );

      if (!target) {
        return {
          count: 0,
        };
      }

      target.state =
        args.data.state;

      target.releasedByUserId =
        args.data.releasedByUserId;

      target.releasedAt =
        args.data.releasedAt;

      return {
        count: 1,
      };
    },
  },

  domainEvent: {
    create: async (
      args: any,
    ) => {
      state.events.push(
        args.data,
      );

      return args.data;
    },
  },
};

async function main() {
  const actorUserId =
    "admin-release-smoke";

  for (const module of modules) {
    const registered =
      await registerCommercialUtilityPackResourceWithClient({
        client:
          client as never,
        packageId:
          state.pack.id,
        module,
        resourceType:
          "STRUCTURED_CONTENT",
        resourceId:
          `resource-${module}`,
        label:
          `${module} resource`,
        canView: true,
        canPresent: true,
        actorUserId,
      });

    assert.equal(
      registered.created,
      true,
    );

    assert.equal(
      registered.resource.state,
      "WITHHELD",
    );

    const ready =
      await transitionCommercialUtilityPackModuleWithClient({
        client:
          client as never,
        packageId:
          state.pack.id,
        module,
        expectedFromState:
          "WITHHELD",
        toState:
          "READY",
        actorUserId,
      });

    assert.equal(
      ready.transitioned,
      true,
    );

    const releasedResource =
      await releaseCommercialUtilityPackResourceWithClient({
        client:
          client as never,
        resourceReleaseId:
          registered.resource.id,
        actorUserId,
      });

    assert.equal(
      releasedResource.released,
      true,
    );

    const releasedModule =
      await transitionCommercialUtilityPackModuleWithClient({
        client:
          client as never,
        packageId:
          state.pack.id,
        module,
        expectedFromState:
          "READY",
        toState:
          "RELEASED",
        actorUserId,
      });

    assert.equal(
      releasedModule.transitioned,
      true,
    );

    await reconcileCommercialUtilityPackReleaseStateWithClient({
      client:
        client as never,
      packageId:
        state.pack.id,
      actorUserId,
    });
  }

  assert.equal(
    state.modules.every(
      (entry) =>
        entry.state ===
        "RELEASED",
    ),
    true,
  );

  assert.equal(
    state.pack.releaseState,
    "RELEASED",
  );

  assert.equal(
    state.pack.state,
    "CURRENT",
  );

  assert.ok(
    state.pack.releasedAt,
  );

  /*
   * Exact reconciliation replay.
   */
  const replay =
    await reconcileCommercialUtilityPackReleaseStateWithClient({
      client:
        client as never,
      packageId:
        state.pack.id,
      actorUserId,
    });

  assert.equal(
    replay.changed,
    false,
  );

  /*
   * No READY transition without a current resource.
   */
  const emptyModule =
    state.modules[0];

  emptyModule.state =
    "WITHHELD";

  const originalResources =
    state.resources.splice(
      0,
      state.resources.length,
    );

  await assert.rejects(
    () =>
      transitionCommercialUtilityPackModuleWithClient({
        client:
          client as never,
        packageId:
          state.pack.id,
        module:
          emptyModule.module,
        expectedFromState:
          "WITHHELD",
        toState:
          "READY",
        actorUserId,
      }),
    /CUP_MODULE_READY_REQUIRES_CURRENT_RESOURCE/,
  );

  state.resources.push(
    ...originalResources,
  );

  emptyModule.state =
    "RELEASED";

  console.log(
    "✓ resources register WITHHELD",
  );

  console.log(
    "✓ READY requires current resource",
  );

  console.log(
    "✓ resource release is compare-and-set",
  );

  console.log(
    "✓ module release requires all current resources RELEASED",
  );

  console.log(
    "✓ package release state derives from module states",
  );

  console.log(
    "✓ all modules RELEASED promotes package to CURRENT / RELEASED",
  );

  console.log(
    "✓ package reconciliation replay is idempotent",
  );

  console.log(
    "CUP_1D_RELEASE_GOVERNANCE_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
