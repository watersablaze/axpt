import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { loadTreasuryAllocationWithClient } from "../../src/domains/treasury/gateway/allocations/persistence/loadTreasuryAllocationWithClient";
import { TREASURY_ALLOCATION_STATUS } from "../../src/domains/treasury/gateway/allocations/status";

import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";
import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import { loadTreasuryExecutionPlanBindingEvidenceWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/loadTreasuryExecutionPlanBindingEvidenceWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { cleanupGovernedTreasuryExecutionFixture } from "./support/cleanupGovernedTreasuryExecutionFixture";
import { establishGovernedAuthorizedTreasuryExecutionFixture } from "./support/establishGovernedAuthorizedTreasuryExecutionFixture";

const prisma = new PrismaClient();

function governedAggregateIdentities(fixture: {
  executionId: string;
  transferId: string;
  authorityAssessmentId: string;
  capacityAssessmentId: string;
  eligibilityAssessmentId: string;
  planId: string;
  allocationId: string;
}) {
  return [
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,
      aggregateId: fixture.executionId,
    },
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,
      aggregateId: fixture.planId,
    },
    {
      aggregateType:
        TREASURY_AGGREGATE_TYPE.EXECUTABLE_TRANCHE_ELIGIBILITY_ASSESSMENT,
      aggregateId: fixture.eligibilityAssessmentId,
    },
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,
      aggregateId: fixture.capacityAssessmentId,
    },
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,
      aggregateId: fixture.authorityAssessmentId,
    },
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,
      aggregateId: fixture.transferId,
    },
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
      aggregateId: fixture.allocationId,
    },
  ] as const;
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const executionId = `smoke-governed-execution-${fixtureId}`;

  const settlementEndpointId = `endpoint-${fixtureId}`;

  const established = await prisma.$transaction(async (tx: TransactionClient) =>
    establishGovernedAuthorizedTreasuryExecutionFixture({
      fixtureId,
      executionId,
      settlementEndpointId,
      amount: "25.50",
      currency: "USD",
      purpose: "Governed authorized Treasury execution fixture smoke",
      client: tx,
    }),
  );

  let cleanupProven = false;

  try {
    const state = await prisma.$transaction(async (tx: TransactionClient) => {
      const execution = await loadTreasuryExecutionWithClient({
        executionId,
        client: tx,
      });

      const allocation = await loadTreasuryAllocationWithClient({
        allocationId: established.allocationId,
        client: tx,
      });

      const binding = await loadTreasuryExecutionPlanBindingEvidenceWithClient({
        executionId,
        client: tx,
      });

      return {
        execution,
        allocation,
        binding,
      };
    });

    assert(state.execution);
    assert.equal(
      state.execution.aggregate.status,
      TREASURY_EXECUTION_STATUS.AUTHORIZED,
    );

    assert(state.allocation);
    assert.equal(
      state.allocation.aggregate.status,
      TREASURY_ALLOCATION_STATUS.ACTIVE,
    );

    assert.equal(state.allocation.aggregate.consumedAmount.amount, "0");

    assert(state.binding);

    assert.equal(state.binding.executionId, executionId);
    assert.equal(state.binding.planId, established.planId);
    assert.equal(state.binding.trancheId, established.trancheId);

    await prisma.$transaction(async (tx: TransactionClient) => {
      await cleanupGovernedTreasuryExecutionFixture({
        fixture: established,
        client: tx,
      });
    });

    const identities = governedAggregateIdentities(established);

    const [remainingAggregates, remainingEvents] = await Promise.all([
      prisma.treasuryGatewayAggregate.count({
        where: {
          OR: identities.map((identity) => ({ ...identity })),
        },
      }),
      prisma.treasuryGatewayEvent.count({
        where: {
          OR: identities.map((identity) => ({ ...identity })),
        },
      }),
    ]);

    assert.equal(remainingAggregates, 0);
    assert.equal(remainingEvents, 0);

    cleanupProven = true;

    console.log({
      governedExecutionEstablished: true,
      executionAuthorized: true,
      allocationActive: true,
      allocationUnconsumed: true,
      durablePlanBindingRecoverable: true,
      governedCleanupProven: true,
      remainingGovernedAggregates: remainingAggregates,
      remainingGovernedEvents: remainingEvents,
    });
  } finally {
    if (!cleanupProven) {
      await prisma.$transaction(async (tx: TransactionClient) => {
        await cleanupGovernedTreasuryExecutionFixture({
          fixture: established,
          client: tx,
        });
      });
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
