import type { PrismaClient, TransactionClient } from "@prisma/client";

import type { TransferExecutionSummary } from "../../treasury/gateway/transfer-execution-summary/contracts";

import type { TreasuryTransferId } from "../../treasury/gateway/shared/identifiers";

import { loadTransferExecutionSummaryWithClient } from "../../treasury/gateway/transfer-execution-summary/application/loadTransferExecutionSummaryWithClient";

import { toControlCenterTransferExecutionSummary } from "./transferExecutionSummary";

type LoadTransferExecutionSummary = (params: {
  transferId: TreasuryTransferId;

  client: TransactionClient;
}) => Promise<TransferExecutionSummary | null>;

export type ControlCenterTransferExecutionSummaryHttpResult =
  | Readonly<{
      status: 200;

      body: Readonly<{
        ok: true;

        summary: ReturnType<typeof toControlCenterTransferExecutionSummary>;
      }>;
    }>
  | Readonly<{
      status: 400;

      body: Readonly<{
        ok: false;

        error: "TRANSFER_ID_REQUIRED";
      }>;
    }>
  | Readonly<{
      status: 404;

      body: Readonly<{
        ok: false;

        error: "TREASURY_TRANSFER_NOT_FOUND";
      }>;
    }>;

export async function loadTransferExecutionSummaryHttp(params: {
  rawTransferId: string;

  prisma: PrismaClient;

  loadSummary?: LoadTransferExecutionSummary;
}): Promise<ControlCenterTransferExecutionSummaryHttpResult> {
  const {
    rawTransferId,
    prisma,
    loadSummary = loadTransferExecutionSummaryWithClient,
  } = params;

  const transferId = rawTransferId.trim();

  if (transferId.length === 0) {
    return {
      status: 400,

      body: {
        ok: false,

        error: "TRANSFER_ID_REQUIRED",
      },
    };
  }

  const summary = await prisma.$transaction((tx: TransactionClient) =>
    loadSummary({
      transferId,

      client: tx,
    }),
  );

  if (!summary) {
    return {
      status: 404,

      body: {
        ok: false,

        error: "TREASURY_TRANSFER_NOT_FOUND",
      },
    };
  }

  return {
    status: 200,

    body: {
      ok: true,

      summary: toControlCenterTransferExecutionSummary(summary),
    },
  };
}
