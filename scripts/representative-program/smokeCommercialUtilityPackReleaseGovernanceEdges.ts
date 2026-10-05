import assert from "node:assert/strict";

import {
  registerCommercialUtilityPackResourceWithClient,
  releaseCommercialUtilityPackResourceWithClient,
  reconcileCommercialUtilityPackReleaseStateWithClient,
  transitionCommercialUtilityPackModuleWithClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

type ModuleState =
  | "WITHHELD"
  | "READY"
  | "RELEASED";

type ResourceState =
  | "WITHHELD"
  | "RELEASED"
  | "SUPERSEDED"
  | "WITHDRAWN";

const state = {
  pack: {
    id: "cup-edge",
    state: "PREPARING",
    releaseState: "WITHHELD",
    releasedByUserId: null as string | null,
    releasedAt: null as Date | null,
  },

  module: {
    id: "module-edge",
    packageId: "cup-edge",
    module: "DOCUMENTS",
    state: "WITHHELD" as ModuleState,
    releasedByUserId: null as string | null,
    releasedAt: null as Date | null,
  },

  resources: [] as Array<{
    id: string;
    packageId: string;
    module: "DOCUMENTS";
    resourceType: "DOCUMENT";
    resourceId: string;
    state: ResourceState;
    label: string | null;
    canView: boolean;
    canDownload: boolean;
    canPresent: boolean;
    canTransmit: boolean;
    releasedByUserId: string | null;
    releasedAt: Date | null;
  }>,

  events: [] as Array<Record<string, unknown>>,
};

const client = {
  user: {
    findUnique: async () => ({
      isAdmin: true,
    }),
  },

  commercialUtilityPack: {
    findUnique: async (args: any) => {
      if (args?.include?.modules) {
        return {
          ...state.pack,
          modules: [state.module],
        };
      }

      return state.pack;
    },

    updateMany: async () => ({
      count: 1,
    }),
  },

  commercialUtilityPackModuleRelease: {
    findUnique: async () =>
      state.module,

    findMany: async () => [
      {
        module: "REPRESENTATION",
        state: "RELEASED",
      },
      {
        module: "COMMERCIAL_PARAMETERS",
        state: "RELEASED",
      },
      {
        module: "DOCUMENTS",
        state: state.module.state,
      },
      {
        module: "OPERATING_BOUNDARIES",
        state: "RELEASED",
      },
    ],

    updateMany: async (args: any) => {
      if (
        state.module.state !==
        args.where.state
      ) {
        return {
          count: 0,
        };
      }

      state.module.state =
        args.data.state;

      state.module.releasedByUserId =
        args.data.releasedByUserId;

      state.module.releasedAt =
        args.data.releasedAt;

      return {
        count: 1,
      };
    },
  },

  commercialUtilityPackResourceRelease: {
    findUnique: async (args: any) => {
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

    findMany: async (args: any) =>
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

    create: async (args: any) => {
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

    updateMany: async (args: any) => {
      const resource =
        state.resources.find(
          (entry) =>
            entry.id ===
              args.where.id &&
            entry.state ===
              args.where.state,
        );

      if (!resource) {
        return {
          count: 0,
        };
      }

      resource.state =
        args.data.state;

      resource.releasedByUserId =
        args.data.releasedByUserId;

      resource.releasedAt =
        args.data.releasedAt;

      return {
        count: 1,
      };
    },
  },

  domainEvent: {
    create: async (args: any) => {
      state.events.push(
        args.data,
      );

      return args.data;
    },
  },
};

async function main() {
  const actorUserId =
    "admin-edge";

  /*
   * Register while WITHHELD.
   */
  const registered =
    await registerCommercialUtilityPackResourceWithClient({
      client:
        client as never,
      packageId:
        state.pack.id,
      module:
        "DOCUMENTS",
      resourceType:
        "DOCUMENT",
      resourceId:
        "cp-current",
      actorUserId,
    });

  assert.equal(
    registered.created,
    true,
  );

  /*
   * Resource release before READY must fail.
   */
  await assert.rejects(
    () =>
      releaseCommercialUtilityPackResourceWithClient({
        client:
          client as never,
        resourceReleaseId:
          registered.resource.id,
        actorUserId,
      }),
    /CUP_RESOURCE_RELEASE_MODULE_NOT_READY/,
  );

  /*
   * WITHHELD → READY succeeds because there is a current resource.
   */
  await transitionCommercialUtilityPackModuleWithClient({
    client:
      client as never,
    packageId:
      state.pack.id,
    module:
      "DOCUMENTS",
    expectedFromState:
      "WITHHELD",
    toState:
      "READY",
    actorUserId,
  });

  /*
   * Resource may now release.
   */
  await releaseCommercialUtilityPackResourceWithClient({
    client:
      client as never,
    resourceReleaseId:
      registered.resource.id,
    actorUserId,
  });

  assert.equal(
    registered.resource.state,
    "RELEASED",
  );

  /*
   * A terminal historical resource must not count as current.
   */
  state.resources.push({
    id:
      "resource-superseded",
    packageId:
      state.pack.id,
    module:
      "DOCUMENTS",
    resourceType:
      "DOCUMENT",
    resourceId:
      "cp-old",
    state:
      "SUPERSEDED",
    label:
      "Old Commercial Profile",
    canView:
      true,
    canDownload:
      false,
    canPresent:
      false,
    canTransmit:
      false,
    releasedByUserId:
      actorUserId,
    releasedAt:
      new Date(),
  });

  /*
   * READY → RELEASED succeeds:
   * RELEASED current resource counts;
   * SUPERSEDED historical resource does not block.
   */
  await transitionCommercialUtilityPackModuleWithClient({
    client:
      client as never,
    packageId:
      state.pack.id,
    module:
      "DOCUMENTS",
    expectedFromState:
      "READY",
    toState:
      "RELEASED",
    actorUserId,
  });

  assert.equal(
    state.module.state,
    "RELEASED",
  );

  /*
   * New resource registration after module release must fail.
   */
  await assert.rejects(
    () =>
      registerCommercialUtilityPackResourceWithClient({
        client:
          client as never,
        packageId:
          state.pack.id,
        module:
          "DOCUMENTS",
        resourceType:
          "DOCUMENT",
        resourceId:
          "late-document",
        actorUserId,
      }),
    /CUP_RESOURCE_REGISTRATION_MODULE_ALREADY_RELEASED/,
  );

  /*
   * Terminal package cannot be revived by reconciliation.
   */
  state.pack.state =
    "WITHDRAWN";

  await assert.rejects(
    () =>
      reconcileCommercialUtilityPackReleaseStateWithClient({
        client:
          client as never,
        packageId:
          state.pack.id,
        actorUserId,
      }),
    /CUP_RELEASE_RECONCILIATION_PACKAGE_TERMINAL/,
  );

  console.log(
    "✓ resource release prohibited before module READY",
  );

  console.log(
    "✓ released resources are valid current resources",
  );

  console.log(
    "✓ SUPERSEDED resources are historical and do not block module release",
  );

  console.log(
    "✓ resource registration prohibited after module RELEASED",
  );

  console.log(
    "✓ terminal package cannot be revived by reconciliation",
  );

  console.log(
    "CUP_1D_RELEASE_EDGE_CASES_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
