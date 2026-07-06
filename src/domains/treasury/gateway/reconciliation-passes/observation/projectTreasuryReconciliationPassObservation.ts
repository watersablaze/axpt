import type {
  LoadedTreasuryReconciliationPass,
  LoadedTreasuryReconciliationPassLifecycle,
} from "../persistence/contracts";

import type { TreasuryReconciliationPassObservation } from "./contracts";

export function projectTreasuryReconciliationPassObservation(params: {
  pass: LoadedTreasuryReconciliationPass;

  lifecycle: LoadedTreasuryReconciliationPassLifecycle;

  observedAt: Date;
}): TreasuryReconciliationPassObservation {
  const { pass, lifecycle, observedAt } = params;

  if (pass.aggregate.id !== lifecycle.passId) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_OBSERVATION_ID_MISMATCH] ${pass.aggregate.id} -> ${lifecycle.passId}`,
    );
  }

  return {
    passId: pass.aggregate.id,

    status: pass.aggregate.status,

    requestedLimit: pass.aggregate.requestedLimit,

    requestedAt: pass.aggregate.requestedAt,

    startedAt: pass.aggregate.startedAt,

    completedAt: pass.aggregate.completedAt,

    version: pass.aggregate.metadata.version,

    summary: pass.aggregate.summary,

    failure: pass.aggregate.failure,

    lifecycle: lifecycle.events.map((event) => ({
      version: event.aggregateVersion,

      eventType: event.eventType,

      occurredAt: event.occurredAt,

      recordedAt: event.recordedAt,

      actorId: event.actorId,

      authorityGrantId: event.authorityGrantId,
    })),

    observedAt,
  };
}
