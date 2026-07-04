import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_ACTION_STATUS } from "@/domains/treasury/stateMachine";

import { loadInternalWalletExecutionConfirmedEvidenceWithClient } from "@/domains/treasury/gateway/executions/adapters/internal-wallet/loadInternalWalletExecutionConfirmedEvidenceWithClient";

import { loadInternalWalletExecutionInitiatedEvidenceWithClient } from "@/domains/treasury/gateway/executions/adapters/internal-wallet/loadInternalWalletExecutionInitiatedEvidenceWithClient";

const prisma = new PrismaClient();

async function main() {
  const runId = randomUUID();

  const executionId = `gateway-execution-${runId}`;

  const idempotencyKey = `gateway-wallet-evidence-${runId}`;

  const senderUsername = `gateway-evidence-sender-${runId}`;

  const receiverUsername = `gateway-evidence-receiver-${runId}`;

  const senderEmail = `${senderUsername}@example.invalid`;

  const receiverEmail = `${receiverUsername}@example.invalid`;

  await prisma
    .$transaction(async (tx: TransactionClient) => {
      const sender = await tx.user.create({
        data: {
          username: senderUsername,
          email: senderEmail,
          passwordHash: "SMOKE_TEST_ONLY",
        },
      });

      const receiver = await tx.user.create({
        data: {
          username: receiverUsername,
          email: receiverEmail,
          passwordHash: "SMOKE_TEST_ONLY",
        },
      });

      const senderWallet = await tx.wallet.create({
        data: {
          userId: sender.id,
        },
      });

      const receiverWallet = await tx.wallet.create({
        data: {
          userId: receiver.id,
        },
      });

      const action = await tx.treasuryAction.create({
        data: {
          initiatorUserId: sender.id,

          fromUserId: sender.id,

          toUserId: receiver.id,

          assetCode: "AXG",

          amountBaseUnits: "7000000000000000000",

          intent: "TREASURY",

          approvalType: "GATEWAY_AUTHORIZED",

          status: TREASURY_ACTION_STATUS.QUEUED,

          idempotencyKey,

          metadata: {
            source: "TREASURY_GATEWAY",

            gatewayExecutionId: executionId,
          },
        },
      });

      const queuedEvidence =
        await loadInternalWalletExecutionInitiatedEvidenceWithClient({
          executionId,

          observedAt: new Date(),

          client: tx,
        });

      if (queuedEvidence !== null) {
        throw new Error("QUEUED_ACTION_FALSELY_INITIATED");
      }

      await tx.treasuryAction.update({
        where: {
          id: action.id,
        },

        data: {
          status: TREASURY_ACTION_STATUS.EXECUTING,
        },
      });

      const initiatedEvidence =
        await loadInternalWalletExecutionInitiatedEvidenceWithClient({
          executionId,

          observedAt: new Date(),

          client: tx,
        });

      if (!initiatedEvidence) {
        throw new Error("EXECUTING_ACTION_MISSING_INITIATED_EVIDENCE");
      }

      const confirmedBeforeLedger =
        await loadInternalWalletExecutionConfirmedEvidenceWithClient({
          executionId,

          confirmedAt: new Date(),

          client: tx,
        });

      if (confirmedBeforeLedger !== null) {
        throw new Error("CONFIRMED_WITHOUT_LEDGER_EVIDENCE");
      }

      const debit = await tx.transaction.create({
        data: {
          userId: sender.id,

          walletId: senderWallet.id,

          type: "DEBIT",

          amount: 7,

          amountBaseUnits: "7000000000000000000",

          assetCode: "AXG",

          idempotencyKey,

          metadata: {
            journalGroupId: idempotencyKey,

            direction: "OUT",
          },
        },
      });

      const credit = await tx.transaction.create({
        data: {
          userId: receiver.id,

          walletId: receiverWallet.id,

          type: "CREDIT",

          amount: 7,

          amountBaseUnits: "7000000000000000000",

          assetCode: "AXG",

          metadata: {
            journalGroupId: idempotencyKey,

            direction: "IN",
          },
        },
      });

      const confirmedEvidence =
        await loadInternalWalletExecutionConfirmedEvidenceWithClient({
          executionId,

          confirmedAt: new Date(),

          client: tx,
        });

      if (!confirmedEvidence) {
        throw new Error("LEDGER_EVIDENCE_NOT_CONFIRMED");
      }

      if (
        confirmedEvidence.debitTransactionId !== debit.id ||
        confirmedEvidence.creditTransactionId !== credit.id
      ) {
        throw new Error("CONFIRMED_TRANSACTION_IDENTITY_MISMATCH");
      }

      await tx.treasuryAction.update({
        where: {
          id: action.id,
        },

        data: {
          status: TREASURY_ACTION_STATUS.FAILED_RETRYABLE,
        },
      });

      const confirmedAfterFailure =
        await loadInternalWalletExecutionConfirmedEvidenceWithClient({
          executionId,

          confirmedAt: new Date(),

          client: tx,
        });

      if (!confirmedAfterFailure) {
        throw new Error("LEDGER_CONFIRMATION_LOST_AFTER_RETRYABLE_FAILURE");
      }

      console.log({
        ok: true,

        queuedAction: queuedEvidence,

        initiatedEvidence,

        confirmedBeforeLedger,

        confirmedEvidence,

        confirmedAfterFailure: {
          treasuryActionStatus: TREASURY_ACTION_STATUS.FAILED_RETRYABLE,

          debitTransactionId: confirmedAfterFailure.debitTransactionId,

          creditTransactionId: confirmedAfterFailure.creditTransactionId,
        },
      });

      throw new Error("ROLLBACK_SMOKE_FIXTURE");
    })
    .catch((error: unknown) => {
      if (
        error instanceof Error &&
        error.message === "ROLLBACK_SMOKE_FIXTURE"
      ) {
        return;
      }

      throw error;
    });
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
