import type { TransactionClient } from "@prisma/client";

import type { TreasuryExecutionId } from "../../../shared/identifiers";

export async function loadInternalWalletTreasuryActionWithClient(params: {
  executionId: TreasuryExecutionId;

  client: TransactionClient;
}) {
  const { executionId, client } = params;

  const actions = await client.treasuryAction.findMany({
    where: {
      metadata: {
        path: ["gatewayExecutionId"],

        equals: executionId,
      },
    },

    take: 2,
  });

  if (actions.length === 0) {
    return null;
  }

  if (actions.length !== 1) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_ACTION_CARDINALITY_VIOLATION] ${executionId} -> ${actions.length}`,
    );
  }

  return actions[0];
}
