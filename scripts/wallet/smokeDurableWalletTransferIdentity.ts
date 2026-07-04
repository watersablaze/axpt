import { randomUUID } from "node:crypto";

import { prisma } from "@/infrastructure/db/prisma";
import { transferToken } from "@/engines/wallet";

const ASSET_CODE = "AXG";
const FUNDING_DISPLAY_AMOUNT = 100;
const TRANSFER_DISPLAY_AMOUNT = "7";

async function main() {
  const runId = randomUUID();

  const senderUsername = `wallet-smoke-sender-${runId}`;

  const receiverUsername = `wallet-smoke-receiver-${runId}`;

  const senderEmail = `${senderUsername}@example.invalid`;

  const receiverEmail = `${receiverUsername}@example.invalid`;

  const firstKey = `wallet-smoke-first-${runId}`;

  const concurrentKey = `wallet-smoke-concurrent-${runId}`;

  let senderUserId: string | null = null;
  let receiverUserId: string | null = null;

  try {
    const sender = await prisma.user.create({
      data: {
        username: senderUsername,
        email: senderEmail,
        passwordHash: "SMOKE_TEST_ONLY",
      },
    });

    senderUserId = sender.id;

    const receiver = await prisma.user.create({
      data: {
        username: receiverUsername,
        email: receiverEmail,
        passwordHash: "SMOKE_TEST_ONLY",
      },
    });

    receiverUserId = receiver.id;

    const senderWallet = await prisma.wallet.create({
      data: {
        userId: sender.id,
      },
    });

    const receiverWallet = await prisma.wallet.create({
      data: {
        userId: receiver.id,
      },
    });

    await prisma.balance.createMany({
      data: [
        {
          userId: sender.id,
          walletId: senderWallet.id,
          tokenType: "AXG",
          assetCode: ASSET_CODE,
          amount: FUNDING_DISPLAY_AMOUNT,
          amountBaseUnits: "100000000000000000000",
        },
        {
          userId: receiver.id,
          walletId: receiverWallet.id,
          tokenType: "AXG",
          assetCode: ASSET_CODE,
          amount: 0,
          amountBaseUnits: "0",
        },
      ],
    });

    const readBalances = async () => {
      const [senderBalance, receiverBalance] = await Promise.all([
        prisma.balance.findFirstOrThrow({
          where: {
            walletId: senderWallet.id,
            assetCode: ASSET_CODE,
          },
        }),

        prisma.balance.findFirstOrThrow({
          where: {
            walletId: receiverWallet.id,
            assetCode: ASSET_CODE,
          },
        }),
      ]);

      return {
        sender: senderBalance.amountBaseUnits.toString(),

        receiver: receiverBalance.amountBaseUnits.toString(),
      };
    };

    const before = await readBalances();

    const first = await transferToken({
      fromUserId: sender.id,
      toUserId: receiver.id,
      amount: TRANSFER_DISPLAY_AMOUNT,
      assetCode: ASSET_CODE,
      idempotencyKey: firstKey,
      bypassPolicy: true,
    });

    const afterFirst = await readBalances();

    const replay = await transferToken({
      fromUserId: sender.id,
      toUserId: receiver.id,
      amount: TRANSFER_DISPLAY_AMOUNT,
      assetCode: ASSET_CODE,
      idempotencyKey: firstKey,
      bypassPolicy: true,
    });

    const afterReplay = await readBalances();

    if (
      first.transactionId !== replay.transactionId ||
      first.debitEventId !== replay.debitEventId ||
      first.creditEventId !== replay.creditEventId
    ) {
      throw new Error("REPLAY_IDENTITY_MISMATCH");
    }

    if (!replay.idempotentReplay) {
      throw new Error("REPLAY_NOT_MARKED_IDEMPOTENT");
    }

    if (
      afterFirst.sender !== afterReplay.sender ||
      afterFirst.receiver !== afterReplay.receiver
    ) {
      throw new Error("REPLAY_MUTATED_BALANCES");
    }

    let conflictObserved = false;

    try {
      await transferToken({
        fromUserId: sender.id,
        toUserId: receiver.id,
        amount: "8",
        assetCode: ASSET_CODE,
        idempotencyKey: firstKey,
        bypassPolicy: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      conflictObserved =
        message.includes("Idempotency key already belongs") ||
        message.includes("IDEMPOTENCY_CONFLICT");
    }

    if (!conflictObserved) {
      throw new Error("CONFLICTING_REPLAY_NOT_REJECTED");
    }

    const beforeConcurrent = await readBalances();

    const concurrentResults = await Promise.all([
      transferToken({
        fromUserId: sender.id,
        toUserId: receiver.id,
        amount: "5",
        assetCode: ASSET_CODE,
        idempotencyKey: concurrentKey,
        bypassPolicy: true,
      }),

      transferToken({
        fromUserId: sender.id,
        toUserId: receiver.id,
        amount: "5",
        assetCode: ASSET_CODE,
        idempotencyKey: concurrentKey,
        bypassPolicy: true,
      }),
    ]);

    const afterConcurrent = await readBalances();

    const [concurrentFirst, concurrentSecond] = concurrentResults;

    if (
      concurrentFirst.transactionId !== concurrentSecond.transactionId ||
      concurrentFirst.debitEventId !== concurrentSecond.debitEventId ||
      concurrentFirst.creditEventId !== concurrentSecond.creditEventId
    ) {
      throw new Error("CONCURRENT_IDENTITY_MISMATCH");
    }

    const firstJournalRows = await prisma.transaction.findMany({
      where: {
        OR: [
          {
            idempotencyKey: firstKey,
          },
          {
            metadata: {
              path: ["journalGroupId"],
              equals: firstKey,
            },
          },
        ],
      },
    });

    const concurrentJournalRows = await prisma.transaction.findMany({
      where: {
        OR: [
          {
            idempotencyKey: concurrentKey,
          },
          {
            metadata: {
              path: ["journalGroupId"],
              equals: concurrentKey,
            },
          },
        ],
      },
    });

    if (firstJournalRows.length !== 2) {
      throw new Error(`FIRST_JOURNAL_ROW_COUNT_${firstJournalRows.length}`);
    }

    if (concurrentJournalRows.length !== 2) {
      throw new Error(
        `CONCURRENT_JOURNAL_ROW_COUNT_${concurrentJournalRows.length}`,
      );
    }

    console.log({
      ok: true,

      firstTransfer: {
        transactionId: first.transactionId,

        replayTransactionId: replay.transactionId,

        replay: replay.idempotentReplay,

        balances: {
          before,
          afterFirst,
          afterReplay,
        },
      },

      conflictingReplayRejected: conflictObserved,

      concurrentTransfer: {
        transactionIds: concurrentResults.map((result) => result.transactionId),

        replayFlags: concurrentResults.map((result) => result.idempotentReplay),

        balances: {
          beforeConcurrent,
          afterConcurrent,
        },

        journalRowCount: concurrentJournalRows.length,
      },
    });
  } finally {
    if (senderUserId || receiverUserId) {
      const userIds = [senderUserId, receiverUserId].filter(
        (value): value is string => value !== null,
      );

      await prisma.$transaction([
        prisma.transaction.deleteMany({
          where: {
            userId: {
              in: userIds,
            },
          },
        }),

        prisma.balance.deleteMany({
          where: {
            userId: {
              in: userIds,
            },
          },
        }),

        prisma.wallet.deleteMany({
          where: {
            userId: {
              in: userIds,
            },
          },
        }),

        prisma.user.deleteMany({
          where: {
            id: {
              in: userIds,
            },
          },
        }),
      ]);
    }

    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
