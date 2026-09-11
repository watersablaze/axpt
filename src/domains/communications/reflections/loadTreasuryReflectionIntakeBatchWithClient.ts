import type { CommunicationsTransactionClient } from "../shared/databaseTypes";

const DEFAULT_LIMIT = 50;

const MAX_LIMIT = 250;

export type TreasuryReflectionIntakeEvent = Readonly<{
  sequence: bigint;

  eventId: string;

  aggregateType: string;

  aggregateId: string;

  eventType: string;

  occurredAt: Date;
}>;

export type TreasuryReflectionIntakeBatch = Readonly<{
  afterSequence: bigint;

  limit: number;

  events: readonly TreasuryReflectionIntakeEvent[];
}>;

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("COMMUNICATION_TREASURY_REFLECTION_INTAKE_LIMIT_INVALID");
  }

  return Math.min(limit, MAX_LIMIT);
}

export async function loadTreasuryReflectionIntakeBatchWithClient({
  client,
  afterSequence,
  limit,
}: {
  client: CommunicationsTransactionClient;

  afterSequence: bigint;

  limit?: number;
}): Promise<TreasuryReflectionIntakeBatch> {
  if (afterSequence < 0n) {
    throw new Error(
      "COMMUNICATION_TREASURY_REFLECTION_INTAKE_SEQUENCE_INVALID",
    );
  }

  const normalizedLimit = normalizeLimit(limit);

  const events = await client.treasuryGatewayEvent.findMany({
    where: {
      sequence: {
        gt: afterSequence,
      },
    },

    orderBy: {
      sequence: "asc",
    },

    take: normalizedLimit,

    select: {
      sequence: true,

      eventId: true,

      aggregateType: true,

      aggregateId: true,

      eventType: true,

      occurredAt: true,
    },
  });

  return {
    afterSequence,

    limit: normalizedLimit,

    events,
  };
}
