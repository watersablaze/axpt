import { randomUUID } from "node:crypto";

import { completeTreasuryReconciliationPass } from "../completeTreasuryReconciliationPass";

import { failTreasuryReconciliationPass } from "../failTreasuryReconciliationPass";

import { requestTreasuryReconciliationPass } from "../requestTreasuryReconciliationPass";

import { startTreasuryReconciliationPass } from "../startTreasuryReconciliationPass";

import { decodeTreasuryReconciliationPassFailure } from "./decodeTreasuryReconciliationPassFailure";

import type { TreasuryExecutionReconciliationBatchResult } from "../../executions/application/runTreasuryExecutionReconciliationBatchContracts";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryReconciliationPass } from "../contracts";

import type { DurableTreasuryReconciliationPassResult } from "./runDurableTreasuryReconciliationPassContracts";

import type { TreasuryDomainResult } from "../../shared/domainResult";

type PersistRequestedPass = (params: {
  result: ReturnType<typeof requestTreasuryReconciliationPass>;

  eventId: string;

  context: TreasuryCommandContext;
}) => Promise<TreasuryReconciliationPass>;

type PersistPassTransition = <TPayload>(params: {
  expectedVersion: number;

  result: TreasuryDomainResult<TreasuryReconciliationPass, TPayload>;

  eventId: string;

  context: TreasuryCommandContext;
}) => Promise<TreasuryReconciliationPass>;

type RunBatch = (params: {
  limit: number;

  context: TreasuryCommandContext;
}) => Promise<TreasuryExecutionReconciliationBatchResult>;

export async function runDurableTreasuryReconciliationPassWithDependencies(params: {
  passId: string;

  limit: number;

  context: TreasuryCommandContext;

  persistRequestedPass: PersistRequestedPass;

  persistPassTransition: PersistPassTransition;

  runBatch: RunBatch;
}): Promise<DurableTreasuryReconciliationPassResult> {
  const {
    passId,
    limit,
    context,
    persistRequestedPass,
    persistPassTransition,
    runBatch,
  } = params;

  const requestedResult = requestTreasuryReconciliationPass({
    passId,

    limit,

    context,
  });

  const requestedPass = await persistRequestedPass({
    result: requestedResult,

    eventId: `event-reconciliation-pass-requested-${randomUUID()}`,

    context,
  });

  const startedContext = {
    ...context,

    commandId: `${context.commandId}:start`,

    causationId: context.commandId,

    requestedAt: new Date(),

    idempotencyKey: `${context.idempotencyKey}:start`,
  };

  const startedResult = startTreasuryReconciliationPass(
    requestedPass,

    startedContext,
  );

  const runningPass = await persistPassTransition({
    expectedVersion: requestedPass.metadata.version,

    result: startedResult,

    eventId: `event-reconciliation-pass-started-${randomUUID()}`,

    context: startedContext,
  });

  try {
    const batch = await runBatch({
      limit: runningPass.requestedLimit,

      context: {
        ...context,

        commandId: `${context.commandId}:batch`,

        causationId: startedContext.commandId,

        requestedAt: new Date(),

        idempotencyKey: `${context.idempotencyKey}:batch`,
      },
    });

    const completedContext = {
      ...context,

      commandId: `${context.commandId}:complete`,

      causationId: `${context.commandId}:batch`,

      requestedAt: new Date(),

      idempotencyKey: `${context.idempotencyKey}:complete`,
    };

    const completedResult = completeTreasuryReconciliationPass({
      pass: runningPass,

      summary: batch.summary,

      context: completedContext,
    });

    const completedPass = await persistPassTransition({
      expectedVersion: runningPass.metadata.version,

      result: completedResult,

      eventId: `event-reconciliation-pass-completed-${randomUUID()}`,

      context: completedContext,
    });

    return {
      pass: completedPass,

      batch,
    };
  } catch (error: unknown) {
    const { errorCode, errorMessage } =
      decodeTreasuryReconciliationPassFailure(error);

    const failedContext = {
      ...context,

      commandId: `${context.commandId}:fail`,

      causationId: `${context.commandId}:batch`,

      requestedAt: new Date(),

      idempotencyKey: `${context.idempotencyKey}:fail`,
    };

    const failedResult = failTreasuryReconciliationPass({
      pass: runningPass,

      errorCode,

      errorMessage,

      context: failedContext,
    });

    const failedPass = await persistPassTransition({
      expectedVersion: runningPass.metadata.version,

      result: failedResult,

      eventId: `event-reconciliation-pass-failed-${randomUUID()}`,

      context: failedContext,
    });

    return {
      pass: failedPass,

      batch: null,
    };
  }
}
