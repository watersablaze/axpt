import assert from "node:assert/strict";

import type { TransactionClient } from "@prisma/client";

import {
  TREASURY_ACTION_STATUS,
  TREASURY_QUEUE_STATUS,
} from "../../src/domains/treasury/stateMachine";

import { triggerTreasuryExecutionWithClient } from "../../src/domains/treasury/triggerExecutionWithClient";

type ActionFixture = {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
};

type QueueFixture = {
  id: string;
  treasuryActionId: string;
  status: string;
  nextRetryAt: Date | null;
  lastError: string | null;
  claimOwner: string | null;
  claimedAt: Date | null;
  retryCount: number;
};

function assertThrowsWithCode(
  fn: () => Promise<unknown>,
  code: string,
): Promise<void> {
  return assert.rejects(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

function createFakeTreasuryClient(params: {
  action: ActionFixture;

  queue?: QueueFixture;
}) {
  const action = {
    ...params.action,
  };

  let queue = params.queue
    ? {
        ...params.queue,
      }
    : null;

  let queueCreateCount = 0;

  const client = {
    treasuryAction: {
      async findUnique(args: {
        where: {
          id: string;
        };
        select?: Record<string, boolean>;
      }) {
        if (args.where.id !== action.id) {
          return null;
        }

        if (args.select) {
          return {
            status: action.status,

            metadata: action.metadata,
          };
        }

        return {
          ...action,
        };
      },

      async updateMany(args: {
        where: {
          id: string;
          status: string;
        };

        data: {
          status: string;
          metadata?: Record<string, unknown>;
        };
      }) {
        if (
          args.where.id !== action.id ||
          args.where.status !== action.status
        ) {
          return {
            count: 0,
          };
        }

        action.status = args.data.status;

        if (args.data.metadata) {
          action.metadata = args.data.metadata;
        }

        return {
          count: 1,
        };
      },
    },

    treasuryExecutionQueue: {
      async findUnique(args: {
        where: {
          treasuryActionId?: string;
          id?: string;
        };
        select?: Record<string, boolean>;
      }) {
        if (!queue) {
          return null;
        }

        if (
          args.where.treasuryActionId &&
          args.where.treasuryActionId !== queue.treasuryActionId
        ) {
          return null;
        }

        if (args.where.id && args.where.id !== queue.id) {
          return null;
        }

        if (args.select) {
          return {
            status: queue.status,
          };
        }

        return {
          ...queue,
        };
      },

      async updateMany(args: {
        where: {
          id: string;
          status: string;
        };

        data: Record<string, unknown>;
      }) {
        if (
          !queue ||
          args.where.id !== queue.id ||
          args.where.status !== queue.status
        ) {
          return {
            count: 0,
          };
        }

        queue = {
          ...queue,
          ...args.data,
        } as QueueFixture;

        return {
          count: 1,
        };
      },

      async create(args: {
        data: {
          treasuryActionId: string;

          status: string;

          nextRetryAt: Date;

          retryCount: number;
        };
      }) {
        queueCreateCount += 1;

        queue = {
          id: "queue-created",

          treasuryActionId: args.data.treasuryActionId,

          status: args.data.status,

          nextRetryAt: args.data.nextRetryAt,

          lastError: null,

          claimOwner: null,

          claimedAt: null,

          retryCount: args.data.retryCount,
        };

        return {
          ...queue,
        };
      },
    },
  };

  return {
    client: client as unknown as TransactionClient,

    getAction: () => ({
      ...action,
    }),

    getQueue: () =>
      queue
        ? {
            ...queue,
          }
        : null,

    getQueueCreateCount: () => queueCreateCount,
  };
}

async function verifyFreshDispatch(): Promise<void> {
  const fake = createFakeTreasuryClient({
    action: {
      id: "action-fresh",

      status: TREASURY_ACTION_STATUS.APPROVED,

      metadata: null,
    },
  });

  const queue = await triggerTreasuryExecutionWithClient(
    "action-fresh",
    fake.client,
  );

  assert.equal(fake.getAction().status, TREASURY_ACTION_STATUS.QUEUED);

  assert.equal(queue.status, TREASURY_QUEUE_STATUS.PENDING);

  assert.equal(fake.getQueueCreateCount(), 1);
}

async function verifyExistingQueueIdempotency(): Promise<void> {
  const fake = createFakeTreasuryClient({
    action: {
      id: "action-existing",

      status: TREASURY_ACTION_STATUS.QUEUED,

      metadata: null,
    },

    queue: {
      id: "queue-existing",

      treasuryActionId: "action-existing",

      status: TREASURY_QUEUE_STATUS.PENDING,

      nextRetryAt: null,

      lastError: null,

      claimOwner: null,

      claimedAt: null,

      retryCount: 0,
    },
  });

  const queue = await triggerTreasuryExecutionWithClient(
    "action-existing",
    fake.client,
  );

  assert.equal(queue.id, "queue-existing");

  assert.equal(fake.getQueueCreateCount(), 0);
}

async function verifyRetryableDispatch(): Promise<void> {
  const fake = createFakeTreasuryClient({
    action: {
      id: "action-retry",

      status: TREASURY_ACTION_STATUS.FAILED_RETRYABLE,

      metadata: null,
    },

    queue: {
      id: "queue-retry",

      treasuryActionId: "action-retry",

      status: TREASURY_QUEUE_STATUS.FAILED_RETRYABLE,

      nextRetryAt: null,

      lastError: "temporary failure",

      claimOwner: "worker-1",

      claimedAt: new Date("2026-07-04T04:00:00.000Z"),

      retryCount: 1,
    },
  });

  const queue = await triggerTreasuryExecutionWithClient(
    "action-retry",
    fake.client,
  );

  assert.equal(fake.getAction().status, TREASURY_ACTION_STATUS.QUEUED);

  assert.equal(queue.status, TREASURY_QUEUE_STATUS.PENDING);

  assert.equal(queue.lastError, null);

  assert.equal(queue.claimOwner, null);

  assert.equal(queue.claimedAt, null);

  assert.equal(fake.getQueueCreateCount(), 0);
}

async function verifyInvalidFreshStatusRejected(): Promise<void> {
  const fake = createFakeTreasuryClient({
    action: {
      id: "action-invalid",

      status: TREASURY_ACTION_STATUS.PENDING,

      metadata: null,
    },
  });

  await assertThrowsWithCode(
    () => triggerTreasuryExecutionWithClient("action-invalid", fake.client),

    "TREASURY_EXECUTION_ACTION_STATUS_INVALID",
  );

  assert.equal(fake.getQueue(), null);
}

async function main(): Promise<void> {
  await verifyFreshDispatch();

  await verifyExistingQueueIdempotency();

  await verifyRetryableDispatch();

  await verifyInvalidFreshStatusRejected();

  console.log("✓ Treasury execution trigger verification passed");
}

main().catch((error: unknown) => {
  console.error(error);

  process.exitCode = 1;
});
