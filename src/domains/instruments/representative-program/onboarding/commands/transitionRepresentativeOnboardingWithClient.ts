import {
  assertRepresentativeOnboardingStatusTransition,
  type RepresentativeOnboardingStatus,
} from "../contracts";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

/**
 * Multi-write lifecycle primitive.
 *
 * Callers must execute this command inside the canonical onboarding
 * transaction boundary.
 */
export async function transitionRepresentativeOnboardingWithClient(params: {
  client: RepresentativeOnboardingPersistenceClient;
  intakeId: string;
  toStatus: RepresentativeOnboardingStatus;
  actorUserId?: string | null;
  reason?: string | null;
  metadata?: Readonly<Record<string, unknown>> | null;
  data?: Readonly<Record<string, unknown>>;
  occurredAt?: Date;
}) {
  const occurredAt = params.occurredAt ?? new Date();

  if (!Number.isFinite(occurredAt.getTime())) {
    throw new Error("[ARP_ONBOARDING_TRANSITION_TIME_INVALID]");
  }

  const intake = await params.client.representativeOnboardingIntake.findUnique({
    where: {
      id: params.intakeId,
    },
  });

  if (!intake) {
    throw new Error(`[ARP_ONBOARDING_INTAKE_NOT_FOUND] ${params.intakeId}`);
  }

  assertRepresentativeOnboardingStatusTransition({
    from: intake.status,
    to: params.toStatus,
  });

  const updated = await params.client.representativeOnboardingIntake.updateMany(
    {
      where: {
        id: intake.id,
        status: intake.status,
      },
      data: {
        ...(params.data ?? {}),
        status: params.toStatus,
      },
    },
  );

  if (updated.count !== 1) {
    throw new Error(
      `[ARP_ONBOARDING_TRANSITION_CONCURRENT_CHANGE] intakeId=${intake.id} expected=${intake.status}`,
    );
  }

  const transition =
    await params.client.representativeOnboardingTransition.create({
      data: {
        intakeId: intake.id,
        fromStatus: intake.status,
        toStatus: params.toStatus,
        actorUserId: params.actorUserId ?? null,
        reason: params.reason ?? null,
        metadata: params.metadata ?? undefined,
        occurredAt,
      },
    });

  const current = await params.client.representativeOnboardingIntake.findUnique(
    {
      where: {
        id: intake.id,
      },
    },
  );

  if (!current) {
    throw new Error(
      `[ARP_ONBOARDING_TRANSITION_POST_UPDATE_NOT_FOUND] ${intake.id}`,
    );
  }

  return {
    intake: current,
    transition,
  } as const;
}
