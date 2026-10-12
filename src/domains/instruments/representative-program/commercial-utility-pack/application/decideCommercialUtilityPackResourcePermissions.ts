import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

type Client = Pick<PrismaClient,
  "user" | "commercialUtilityPackResourceRelease" | "domainEvent">;

export const cupResourcePermissionsSchema = z.object({
  canView: z.boolean(),
  canDownload: z.boolean(),
  canPresent: z.boolean(),
  canTransmit: z.boolean(),
}).strict();

type Permissions = z.infer<typeof cupResourcePermissionsSchema>;

type Resource = Permissions & {
  id: string;
  packageId: string;
  module: string;
  resourceType: string;
  resourceId: string;
  label: string | null;
  state: string;
  releasedAt: Date | null;
  releasedByUserId: string | null;
  updatedAt: Date;
  package: {
    id: string;
    reference: string;
    participantId: string;
    state: string;
    releaseState: string;
    audience: string;
    updatedAt: Date;
    modules: { module: string; state: string; updatedAt: Date }[];
  };
};

function permissions(resource: Permissions): Permissions {
  return {
    canView: resource.canView,
    canDownload: resource.canDownload,
    canPresent: resource.canPresent,
    canTransmit: resource.canTransmit,
  };
}

export async function reviewCommercialUtilityPackResourcePermissions(input: {
  client: Client;
  actorUserId: string;
  resourceReleaseId: string;
}) {
  const actorUserId = input.actorUserId.trim();
  const resourceReleaseId = input.resourceReleaseId.trim();
  if (!actorUserId || !resourceReleaseId || resourceReleaseId.length > 191) {
    throw new Error("[CUP_PERMISSION_INPUT_INVALID]");
  }

  const actor = await input.client.user.findUnique({
    where: { id: actorUserId }, select: { isAdmin: true },
  });
  if (!actor?.isAdmin) throw new Error("[CUP_PERMISSION_ADMIN_REQUIRED]");

  const resource: Resource | null =
    await input.client.commercialUtilityPackResourceRelease.findUnique({
      where: { id: resourceReleaseId },
      include: {
        package: {
          select: {
            id: true, reference: true, participantId: true,
            state: true, releaseState: true, audience: true,
            updatedAt: true,
            modules: {
              select: { module: true, state: true, updatedAt: true },
              orderBy: { module: "asc" },
            },
          },
        },
      },
    });
  if (!resource) throw new Error("[CUP_PERMISSION_RESOURCE_REQUIRED]");

  const modules = resource.package.modules.filter(
    module => module.module === resource.module,
  );
  if (
    !["PREPARING", "CURRENT"].includes(resource.package.state) ||
    resource.package.audience !== "REPRESENTATIVE" ||
    !["PARTIAL", "RELEASED"].includes(resource.package.releaseState) ||
    resource.state !== "RELEASED" ||
    !resource.releasedAt || !resource.releasedByUserId ||
    modules.length !== 1 || modules[0].state !== "RELEASED"
  ) throw new Error("[CUP_PERMISSION_RELEASE_STATE_CONFLICT]");

  const basis = {
    resourceReleaseId: resource.id,
    packageId: resource.packageId,
    packageReference: resource.package.reference,
    participantId: resource.package.participantId,
    module: resource.module,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    label: resource.label,
    state: resource.state,
    releasedAt: resource.releasedAt.toISOString(),
    releasedByUserId: resource.releasedByUserId,
    resourceUpdatedAt: resource.updatedAt.toISOString(),
    packageUpdatedAt: resource.package.updatedAt.toISOString(),
    packageState: resource.package.state,
    releaseState: resource.package.releaseState,
    moduleUpdatedAt: modules[0].updatedAt.toISOString(),
    permissions: permissions(resource),
  };
  const reviewHash = createHash("sha256")
    .update(JSON.stringify(basis)).digest("hex");

  return { resource, basis, reviewHash };
}

// Call only inside the caller's Serializable transaction.
// The permission update and audit event must commit or roll back together.
export async function decideCommercialUtilityPackResourcePermissionsWithClient(input: {
  client: Client;
  actorUserId: string;
  resourceReleaseId: string;
  reviewHash: string;
  permissions: Permissions;
  reason: string;
  confirmDecision: boolean;
}) {
  const next = cupResourcePermissionsSchema.parse(input.permissions);
  const reason = input.reason.trim();
  if (
    input.confirmDecision !== true ||
    !/^[a-f0-9]{64}$/.test(input.reviewHash) ||
    !reason || reason.length > 4000 ||
    (!next.canView && (next.canDownload || next.canPresent || next.canTransmit))
  ) throw new Error("[CUP_PERMISSION_DECISION_INVALID]");

  const review = await reviewCommercialUtilityPackResourcePermissions(input);
  if (review.reviewHash !== input.reviewHash) {
    throw new Error("[CUP_PERMISSION_REVIEW_CHANGED]");
  }

  const previous = review.basis.permissions;
  if (JSON.stringify(previous) === JSON.stringify(next)) {
    return { resourceReleaseId: review.resource.id, changed: false };
  }

  const updated = await input.client.commercialUtilityPackResourceRelease.updateMany({
    where: {
      id: review.resource.id,
      state: "RELEASED",
      updatedAt: review.resource.updatedAt,
      ...previous,
    },
    data: next,
  });
  if (updated.count !== 1) {
    throw new Error("[CUP_PERMISSION_REVIEW_CHANGED]");
  }

  await input.client.domainEvent.create({
    data: {
      streamType: "COMMERCIAL_UTILITY_PACK",
      streamId: review.resource.packageId,
      eventType: "COMMERCIAL_UTILITY_PACK_RESOURCE_PERMISSIONS_DECIDED",
      eventVersion: 1,
      payload: {
        resourceReleaseId: review.resource.id,
        resourceId: review.resource.resourceId,
        resourceType: review.resource.resourceType,
        module: review.resource.module,
        reviewHash: review.reviewHash,
        previous,
        permissions: next,
        reason,
      },
      metadata: {
        actorUserId: input.actorUserId.trim(),
        source: "representative-program.commercial-utility-pack.permission-decision",
      },
      occurredAt: new Date(),
    },
  });

  return { resourceReleaseId: review.resource.id, changed: true };
}
