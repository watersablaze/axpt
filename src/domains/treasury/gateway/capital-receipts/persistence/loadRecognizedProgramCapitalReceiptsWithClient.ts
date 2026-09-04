import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { ProgramAccountId } from "../../shared/identifiers";

import type { CurrencyCode } from "../../shared/money";

import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "../status";

import type { ProgramCapitalReceipt } from "../contracts";

import { decodeProgramCapitalReceiptSnapshot } from "./decodeProgramCapitalReceiptSnapshot";

export async function loadRecognizedProgramCapitalReceiptsWithClient(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  client: TransactionClient;
}): Promise<readonly ProgramCapitalReceipt[]> {
  const { programAccountId, currency, client } = params;

  const rows = await client.treasuryGatewayAggregate.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

      status: PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED,
    },

    orderBy: {
      createdAt: "asc",
    },
  });

  const receipts: ProgramCapitalReceipt[] = [];

  for (const row of rows) {
    const aggregate = decodeProgramCapitalReceiptSnapshot(row.snapshot);

    if (aggregate.id !== row.aggregateId) {
      throw new Error(
        `[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
      );
    }

    if (aggregate.metadata.version !== row.version) {
      throw new Error(
        `[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
      );
    }

    if (aggregate.status !== row.status) {
      throw new Error(
        `[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
      );
    }

    if (!aggregate.recognizedAmount) {
      throw new Error(
        `[TREASURY_GATEWAY_RECOGNIZED_CAPITAL_RECEIPT_AMOUNT_REQUIRED] ${aggregate.id}`,
      );
    }

    if (aggregate.destinationProgramAccountId !== programAccountId) {
      continue;
    }

    if (aggregate.recognizedAmount.currency !== currency) {
      continue;
    }

    receipts.push(aggregate);
  }

  return receipts;
}
