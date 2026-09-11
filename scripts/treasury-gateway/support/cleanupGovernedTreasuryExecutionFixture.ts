import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../../src/domains/treasury/gateway/events/aggregateTypes";

export type GovernedTreasuryExecutionFixtureIdentity = Readonly<{
  executionId: string;
  transferId: string;
  authorityAssessmentId: string;
  capacityAssessmentId: string;
  eligibilityAssessmentId: string;
  planId: string;
  allocationId: string;
}>;

export async function cleanupGovernedTreasuryExecutionFixture(params: {
  fixture: GovernedTreasuryExecutionFixtureIdentity;
  client: TransactionClient;
}): Promise<void> {
  const { fixture, client } = params;

  const aggregates = [
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

  for (const aggregate of aggregates) {
    await client.treasuryGatewayEvent.deleteMany({
      where: aggregate,
    });
  }

  for (const aggregate of aggregates) {
    await client.treasuryGatewayAggregate.deleteMany({
      where: aggregate,
    });
  }
}
