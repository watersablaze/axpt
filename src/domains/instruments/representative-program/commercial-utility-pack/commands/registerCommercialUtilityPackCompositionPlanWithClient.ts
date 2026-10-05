import {
  registerCommercialUtilityPackResourceWithClient,
  type CommercialUtilityPackResourceRegistrationClient,
} from "./registerCommercialUtilityPackResourceWithClient";

import {
  toCommercialUtilityPackResourceIdentity,
} from "../composition/contracts";

import {
  COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY,
  type CommercialUtilityPackCompositionPlan,
} from "../composition/resolveCommercialUtilityPackCompositionPlanWithClient";

export type CommercialUtilityPackCompositionRegistrationClient =
  CommercialUtilityPackResourceRegistrationClient;

export type CommercialUtilityPackCompositionRegistrationResult =
  Readonly<{
    packageId:
      string;

    participantId:
      string;

    registered:
      ReadonlyArray<
        Readonly<{
          projectionKey:
            string;

          module:
            string;

          resourceType:
            string;

          resourceId:
            string;

          created:
            boolean;

          resourceReleaseId:
            string;

          state:
            string;
        }>
      >;

    unavailableCount:
      number;
  }>;

type RegistrationIntent =
  Readonly<{
    projectionKey:
      string;

    module:
      CommercialUtilityPackCompositionPlan["entries"][number]["module"];

    resourceType:
      ReturnType<
        typeof toCommercialUtilityPackResourceIdentity
      >["resourceType"];

    resourceId:
      string;

    label:
      string;
  }>;

/**
 * Persist AVAILABLE composition descriptors as CUP resource identities.
 *
 * Integrity order:
 *
 * 1. prove package ↔ participant binding;
 * 2. validate the complete composition plan;
 * 3. derive registration intents without mutation;
 * 4. delegate each mutation to the canonical resource-registration command.
 *
 * It does not:
 * - create a CUP package;
 * - reinterpret canonical source content;
 * - register UNAVAILABLE plan entries;
 * - transition a module to READY;
 * - release a resource;
 * - release a module;
 * - reconcile package release state.
 */
export async function registerCommercialUtilityPackCompositionPlanWithClient(
  params: Readonly<{
    client:
      CommercialUtilityPackCompositionRegistrationClient;

    packageId:
      string;

    plan:
      CommercialUtilityPackCompositionPlan;

    actorUserId:
      string;
  }>,
): Promise<
  CommercialUtilityPackCompositionRegistrationResult
> {
  const packageId =
    params.packageId.trim();

  const actorUserId =
    params.actorUserId.trim();

  if (!packageId || !actorUserId) {
    throw new Error(
      "[CUP_COMPOSITION_REGISTRATION_INPUT_INVALID]",
    );
  }

  const participantId =
    params.plan.participantId.trim();

  if (!participantId) {
    throw new Error(
      "[CUP_COMPOSITION_REGISTRATION_PLAN_PARTICIPANT_REQUIRED]",
    );
  }

  /*
   * A composition plan is representative-specific.
   *
   * Never allow a valid plan for one participant to be persisted into
   * another participant's CUP envelope.
   */
  const pack =
    await params.client
      .commercialUtilityPack
      .findUnique({
        where: {
          id:
            packageId,
        },

        select: {
          id:
            true,

          participantId:
            true,
        },
      });

  if (!pack) {
    throw new Error(
      `[CUP_COMPOSITION_REGISTRATION_PACKAGE_NOT_FOUND] ${packageId}`,
    );
  }

  if (
    pack.participantId !==
      participantId
  ) {
    throw new Error(
      "[CUP_COMPOSITION_REGISTRATION_PARTICIPANT_CONTRADICTION]",
    );
  }

  /*
   * Validate and derive the full write set before the first mutation.
   *
   * This makes malformed composition plans fail closed before any resource
   * registration is attempted, even when this with-client command is
   * accidentally invoked outside its intended governance transaction.
   */
  const intents:
    RegistrationIntent[] =
    [];

  let unavailableCount = 0;

  for (const entry of params.plan.entries) {
    if (
      entry.availability ===
        COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
          .UNAVAILABLE
    ) {
      if (
        entry.descriptor !== null ||
        entry.unavailableReason === null
      ) {
        throw new Error(
          "[CUP_COMPOSITION_REGISTRATION_UNAVAILABLE_ENTRY_CONTRADICTION]",
        );
      }

      unavailableCount += 1;
      continue;
    }

    if (
      entry.availability !==
        COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
          .AVAILABLE ||
      !entry.descriptor ||
      entry.unavailableReason !== null
    ) {
      throw new Error(
        "[CUP_COMPOSITION_REGISTRATION_AVAILABLE_ENTRY_CONTRADICTION]",
      );
    }

    if (
      entry.descriptor.module !==
        entry.module
    ) {
      throw new Error(
        "[CUP_COMPOSITION_REGISTRATION_MODULE_CONTRADICTION]",
      );
    }

    const identity =
      toCommercialUtilityPackResourceIdentity(
        entry.descriptor,
      );

    intents.push({
      projectionKey:
        entry.descriptor.projectionKey,

      module:
        entry.descriptor.module,

      resourceType:
        identity.resourceType,

      resourceId:
        identity.resourceId,

      label:
        entry.descriptor.label,
    });
  }

  const registered:
    CommercialUtilityPackCompositionRegistrationResult["registered"][number][] =
    [];

  for (const intent of intents) {
    const result =
      await registerCommercialUtilityPackResourceWithClient({
        client:
          params.client,

        packageId,

        module:
          intent.module,

        resourceType:
          intent.resourceType,

        resourceId:
          intent.resourceId,

        label:
          intent.label,

        canView:
          true,

        canDownload:
          false,

        canPresent:
          false,

        canTransmit:
          false,

        actorUserId,
      });

    registered.push({
      projectionKey:
        intent.projectionKey,

      module:
        intent.module,

      resourceType:
        intent.resourceType,

      resourceId:
        intent.resourceId,

      created:
        result.created,

      resourceReleaseId:
        result.resource.id,

      state:
        result.resource.state,
    });
  }

  return {
    packageId,
    participantId,
    registered,
    unavailableCount,
  };
}
