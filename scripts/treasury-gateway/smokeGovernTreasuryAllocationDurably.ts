import { PrismaClient } from "@prisma/client";
import type { TransactionClient } from "@prisma/client";

import {
  createTreasuryAllocationIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/createTreasuryAllocationIdempotentlyWithClient";

import {
  submitTreasuryAllocationForReviewDurablyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/submitTreasuryAllocationForReviewDurablyWithClient";

import {
  approveTreasuryAllocationDurablyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/approveTreasuryAllocationDurablyWithClient";

import {
  activateTreasuryAllocationDurablyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/activateTreasuryAllocationDurablyWithClient";

import {
  TREASURY_ALLOCATION_PURPOSE,
} from "../../src/domains/treasury/gateway/allocations/contracts";

import {
  TREASURY_ALLOCATION_STATUS,
} from "../../src/domains/treasury/gateway/allocations/status";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../src/domains/treasury/gateway/events/aggregateTypes";

import {
  TREASURY_EVENT_TYPE,
} from "../../src/domains/treasury/gateway/events/eventType";

const prisma = new PrismaClient();

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const allocationId = `allocation-governance-smoke-${suffix}`;
const reference = `ALLOC-GOV-${suffix}`;

const programId = `program-allocation-governance-${suffix}`;
const sourceProgramAccountId = `program-account-governance-${suffix}`;

const actorId = `actor-allocation-proposer-${suffix}`;
const reviewerActorId = `actor-allocation-reviewer-${suffix}`;
const approverActorId = `actor-allocation-approver-${suffix}`;
const activatorActorId = `actor-allocation-activator-${suffix}`;

const approvalId = `approval-allocation-${suffix}`;

function context(params: {
  commandId: string;
  idempotencyKey: string;
  actorId: string;
  requestedAt: string;
}) {
  return {
    commandId: params.commandId,

    idempotencyKey: params.idempotencyKey,

    actorId: params.actorId,

    correlationId: `correlation-allocation-governance-${suffix}`,

    requestedAt: new Date(params.requestedAt),
  };
}

async function main() {
  const created = await prisma.$transaction(
    (client: TransactionClient) =>
      createTreasuryAllocationIdempotentlyWithClient({
        request: {
          allocationId,

          reference,

          eventId: `event-allocation-created-${suffix}`,

          context: context({
            commandId: `command-allocation-created-${suffix}`,
            idempotencyKey: `idempotency-allocation-created-${suffix}`,
            actorId,
            requestedAt: "2026-09-05T12:00:00.000Z",
          }),

          payload: {
            programId,

            sourceProgramAccountId,

            purposeType: TREASURY_ALLOCATION_PURPOSE.PROGRAM_OPERATIONS,

            amount: {
              amount: "75000.00",

              currency: "USDT",
            },
          },
        },

        client,
      }),
  );

  if (created.aggregate.status !== TREASURY_ALLOCATION_STATUS.PROPOSED) {
    throw new Error(
      `Expected PROPOSED @ creation, received ${created.aggregate.status}`,
    );
  }

  if (created.aggregate.metadata.version !== 1) {
    throw new Error(
      `Expected creation version 1, received ${created.aggregate.metadata.version}`,
    );
  }

  /*
   * ACTIVE cannot be reached directly from PROPOSED.
   * This must fail without mutating durable state.
   */
  let prematureActivationError: string | undefined;

  try {
    await prisma.$transaction(
      (client: TransactionClient) =>
        activateTreasuryAllocationDurablyWithClient({
          allocationId,

          eventId: `event-premature-activation-${suffix}`,

          context: context({
            commandId: `command-premature-activation-${suffix}`,
            idempotencyKey: `idempotency-premature-activation-${suffix}`,
            actorId: activatorActorId,
            requestedAt: "2026-09-05T12:01:00.000Z",
          }),

          client,
        }),
    );
  } catch (error: unknown) {
    prematureActivationError =
      error instanceof Error ? error.message : String(error);
  }

  if (!prematureActivationError) {
    throw new Error("Premature activation unexpectedly succeeded");
  }

  const afterPrematureActivation =
    await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

          aggregateId: allocationId,
        },
      },
    });

  if (
    !afterPrematureActivation ||
    afterPrematureActivation.status !== TREASURY_ALLOCATION_STATUS.PROPOSED ||
    afterPrematureActivation.version !== 1
  ) {
    throw new Error(
      "Rejected premature activation changed durable allocation state",
    );
  }

  const underReview = await prisma.$transaction(
    (client: TransactionClient) =>
      submitTreasuryAllocationForReviewDurablyWithClient({
        allocationId,

        eventId: `event-allocation-review-${suffix}`,

        context: context({
          commandId: `command-allocation-review-${suffix}`,
          idempotencyKey: `idempotency-allocation-review-${suffix}`,
          actorId: reviewerActorId,
          requestedAt: "2026-09-05T12:02:00.000Z",
        }),

        client,
      }),
  );

  if (underReview.aggregate.status !== TREASURY_ALLOCATION_STATUS.UNDER_REVIEW) {
    throw new Error(
      `Expected UNDER_REVIEW, received ${underReview.aggregate.status}`,
    );
  }

  if (underReview.aggregate.metadata.version !== 2) {
    throw new Error(
      `Expected review version 2, received ${underReview.aggregate.metadata.version}`,
    );
  }

  /*
   * Approval evidence is mandatory.
   * Failure must leave UNDER_REVIEW @ v2 unchanged.
   */
  let missingApprovalEvidenceError: string | undefined;

  try {
    await prisma.$transaction(
      (client: TransactionClient) =>
        approveTreasuryAllocationDurablyWithClient({
          allocationId,

          approvalIds: [],

          eventId: `event-empty-approval-${suffix}`,

          context: context({
            commandId: `command-empty-approval-${suffix}`,
            idempotencyKey: `idempotency-empty-approval-${suffix}`,
            actorId: approverActorId,
            requestedAt: "2026-09-05T12:03:00.000Z",
          }),

          client,
        }),
    );
  } catch (error: unknown) {
    missingApprovalEvidenceError =
      error instanceof Error ? error.message : String(error);
  }

  if (
    missingApprovalEvidenceError !==
    "[TREASURY_ALLOCATION_APPROVAL_EVIDENCE_REQUIRED]"
  ) {
    throw new Error(
      `Expected approval evidence rejection, received ${missingApprovalEvidenceError ?? "no error"}`,
    );
  }

  const afterMissingApproval =
    await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

          aggregateId: allocationId,
        },
      },
    });

  if (
    !afterMissingApproval ||
    afterMissingApproval.status !==
      TREASURY_ALLOCATION_STATUS.UNDER_REVIEW ||
    afterMissingApproval.version !== 2
  ) {
    throw new Error(
      "Rejected approval changed durable allocation state",
    );
  }

  const approved = await prisma.$transaction(
    (client: TransactionClient) =>
      approveTreasuryAllocationDurablyWithClient({
        allocationId,

        approvalIds: [approvalId],

        eventId: `event-allocation-approved-${suffix}`,

        context: context({
          commandId: `command-allocation-approved-${suffix}`,
          idempotencyKey: `idempotency-allocation-approved-${suffix}`,
          actorId: approverActorId,
          requestedAt: "2026-09-05T12:04:00.000Z",
        }),

        client,
      }),
  );

  if (approved.aggregate.status !== TREASURY_ALLOCATION_STATUS.APPROVED) {
    throw new Error(
      `Expected APPROVED, received ${approved.aggregate.status}`,
    );
  }

  if (approved.aggregate.metadata.version !== 3) {
    throw new Error(
      `Expected approval version 3, received ${approved.aggregate.metadata.version}`,
    );
  }

  if (approved.aggregate.approvedByActorId !== approverActorId) {
    throw new Error("Approver identity was not preserved");
  }

  if (!approved.aggregate.approvedAt) {
    throw new Error("Approval timestamp was not preserved");
  }

  /*
   * APPROVED is deliberately inspected before activation.
   * No ACTIVE fact may exist yet.
   */
  const activationEventsBeforeActivation =
    await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

        aggregateId: allocationId,

        eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_ACTIVATED,
      },
    });

  if (activationEventsBeforeActivation !== 0) {
    throw new Error(
      `APPROVED allocation already has ${activationEventsBeforeActivation} activation event(s)`,
    );
  }

  const active = await prisma.$transaction(
    (client: TransactionClient) =>
      activateTreasuryAllocationDurablyWithClient({
        allocationId,

        eventId: `event-allocation-activated-${suffix}`,

        context: context({
          commandId: `command-allocation-activated-${suffix}`,
          idempotencyKey: `idempotency-allocation-activated-${suffix}`,
          actorId: activatorActorId,
          requestedAt: "2026-09-05T12:05:00.000Z",
        }),

        client,
      }),
  );

  if (active.aggregate.status !== TREASURY_ALLOCATION_STATUS.ACTIVE) {
    throw new Error(
      `Expected ACTIVE, received ${active.aggregate.status}`,
    );
  }

  if (active.aggregate.metadata.version !== 4) {
    throw new Error(
      `Expected activation version 4, received ${active.aggregate.metadata.version}`,
    );
  }

  if (!active.aggregate.activatedAt) {
    throw new Error("Activation timestamp was not preserved");
  }

  if (
    active.aggregate.amount.amount !== "75000.00" ||
    active.aggregate.amount.currency !== "USDT"
  ) {
    throw new Error("Activation changed allocation amount");
  }

  if (
    active.aggregate.consumedAmount.amount !== "0" ||
    active.aggregate.consumedAmount.currency !== "USDT"
  ) {
    throw new Error("Activation changed consumed amount");
  }

  const events = await prisma.treasuryGatewayEvent.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

      aggregateId: allocationId,
    },

    orderBy: {
      aggregateVersion: "asc",
    },
  });

  const expectedEventTypes = [
    TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_CREATED,
    TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_REVIEW_STARTED,
    TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_APPROVED,
    TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_ACTIVATED,
  ];

  if (events.length !== expectedEventTypes.length) {
    throw new Error(
      `Expected ${expectedEventTypes.length} lifecycle events, received ${events.length}`,
    );
  }

  events.forEach(
    (
      event: {
        aggregateVersion: number;
        eventType: string;
      },
      index: number,
    ) => {
      const expectedVersion = index + 1;
    const expectedType = expectedEventTypes[index];

    if (event.aggregateVersion !== expectedVersion) {
      throw new Error(
        `Event ${index} expected version ${expectedVersion}, received ${event.aggregateVersion}`,
      );
    }

      if (event.eventType !== expectedType) {
        throw new Error(
          `Event ${index} expected ${expectedType}, received ${event.eventType}`,
        );
      }
    },
  );

  const finalRow = await prisma.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

        aggregateId: allocationId,
      },
    },
  });

  if (
    !finalRow ||
    finalRow.status !== TREASURY_ALLOCATION_STATUS.ACTIVE ||
    finalRow.version !== 4
  ) {
    throw new Error("Final durable allocation state is invalid");
  }

  console.log("✓ Governed Treasury Allocation lifecycle smoke test passed");
  console.log("");
  console.log("lifecycle:");
  console.log("  v1  PROPOSED");
  console.log("  v2  UNDER_REVIEW");
  console.log("  v3  APPROVED");
  console.log("  v4  ACTIVE");
  console.log("");
  console.log("governance law:");
  console.log("  premature activation       rejected");
  console.log("  empty approval evidence    rejected");
  console.log(`  approval evidence          ${approvalId}`);
  console.log(`  approved by                ${approved.aggregate.approvedByActorId}`);
  console.log("");
  console.log("financial-fact boundary:");
  console.log(
    `  activation events @ APPROVED   ${activationEventsBeforeActivation}`,
  );
  console.log("  ACTIVE established              yes");
  console.log(
    `  allocation amount              ${active.aggregate.amount.amount} ${active.aggregate.amount.currency}`,
  );
  console.log(
    `  consumed amount                ${active.aggregate.consumedAmount.amount} ${active.aggregate.consumedAmount.currency}`,
  );
  console.log("");
  console.log("durability:");
  console.log(`  final status               ${finalRow.status}`);
  console.log(`  final version              ${finalRow.version}`);
  console.log(`  lifecycle events           ${events.length}`);
}

main()
  .catch((error) => {
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
