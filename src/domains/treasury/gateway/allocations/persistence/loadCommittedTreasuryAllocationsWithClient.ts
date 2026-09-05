import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { ProgramAccountId } from "../../shared/identifiers";

import type { CurrencyCode } from "../../shared/money";

import type { TreasuryAllocation } from "../contracts";

import { TREASURY_ALLOCATION_STATUS } from "../status";

import { decodeTreasuryAllocationSnapshot } from "./decodeTreasuryAllocationSnapshot";

export async function loadCommittedTreasuryAllocationsWithClient(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  client: TransactionClient;
}): Promise<readonly TreasuryAllocation[]> {
  const { programAccountId, currency, client } = params;

  const rows = await client.treasuryGatewayAggregate.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

      status: {
        in: [
          TREASURY_ALLOCATION_STATUS.ACTIVE,
          TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED,
        ],
      },
    },

    orderBy: {
      createdAt: "asc",
    },
  });

  const allocations: TreasuryAllocation[] = [];

  for (const row of rows) {
    const aggregate = decodeTreasuryAllocationSnapshot(row.snapshot);

    if (aggregate.id !== row.aggregateId) {
      throw new Error(
        `[TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
      );
    }

    if (aggregate.metadata.version !== row.version) {
      throw new Error(
        `[TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
      );
    }

    if (aggregate.status !== row.status) {
      throw new Error(
        `[TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
      );
    }

    if (aggregate.sourceProgramAccountId !== programAccountId) {
      continue;
    }

    if (
      aggregate.amount.currency !== currency &&
      aggregate.consumedAmount.currency !== currency
    ) {
      continue;
    }

    /*
     * A mixed-currency allocation is corrupt even when one side happens
     * to match the requested projection currency.
     */
    if (aggregate.amount.currency !== aggregate.consumedAmount.currency) {
      throw new Error(
        `[TREASURY_GATEWAY_ALLOCATION_MONEY_CURRENCY_MISMATCH] ${aggregate.id}:${aggregate.amount.currency}/${aggregate.consumedAmount.currency}`,
      );
    }

    if (aggregate.amount.currency !== currency) {
      continue;
    }

    allocations.push(aggregate);
  }

  return allocations;
}
