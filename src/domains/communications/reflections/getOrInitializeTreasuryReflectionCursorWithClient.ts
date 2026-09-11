import type { CommunicationsTransactionClient } from "../shared/databaseTypes";

import { COMMUNICATION_REFLECTION_SOURCE_SYSTEM } from "./reflectionVocabulary";

export type TreasuryReflectionIntakeCursor = Readonly<{
  sourceSystem: typeof COMMUNICATION_REFLECTION_SOURCE_SYSTEM.TREASURY_GATEWAY;

  lastSequence: bigint;

  lastEventId: string | null;

  initializedAt: Date;

  updatedAt: Date;
}>;

export async function getOrInitializeTreasuryReflectionCursorWithClient({
  client,
}: {
  client: CommunicationsTransactionClient;
}): Promise<TreasuryReflectionIntakeCursor> {
  const sourceSystem = COMMUNICATION_REFLECTION_SOURCE_SYSTEM.TREASURY_GATEWAY;

  const existing = await client.communicationReflectionIntakeCursor.findUnique({
    where: {
      sourceSystem,
    },
  });

  if (existing) {
    return {
      sourceSystem,

      lastSequence: existing.lastSequence,

      lastEventId: existing.lastEventId,

      initializedAt: existing.initializedAt,

      updatedAt: existing.updatedAt,
    };
  }

  /*
   * C3.2B is future-forward by default.
   *
   * On first initialization, Communications adopts the
   * current Treasury event high-water mark rather than
   * silently replaying historical Treasury events.
   *
   * Explicit historical replay, if later introduced,
   * must be a separate governed operation.
   */
  const highWaterEvent = await client.treasuryGatewayEvent.findFirst({
    orderBy: {
      sequence: "desc",
    },

    select: {
      sequence: true,

      eventId: true,
    },
  });

  const highWaterSequence = highWaterEvent?.sequence ?? 0n;

  const highWaterEventId = highWaterEvent?.eventId ?? null;

  /*
   * createMany + skipDuplicates makes concurrent first
   * initialization safe against the sourceSystem PK.
   *
   * Whichever initializer establishes the cursor becomes
   * the durable observation boundary. All later callers
   * read that same canonical cursor.
   */
  await client.communicationReflectionIntakeCursor.createMany({
    data: [
      {
        sourceSystem,

        lastSequence: highWaterSequence,

        lastEventId: highWaterEventId,
      },
    ],

    skipDuplicates: true,
  });

  const initialized =
    await client.communicationReflectionIntakeCursor.findUnique({
      where: {
        sourceSystem,
      },
    });

  if (!initialized) {
    throw new Error(
      "COMMUNICATION_TREASURY_REFLECTION_CURSOR_INITIALIZATION_FAILED",
    );
  }

  return {
    sourceSystem,

    lastSequence: initialized.lastSequence,

    lastEventId: initialized.lastEventId,

    initializedAt: initialized.initializedAt,

    updatedAt: initialized.updatedAt,
  };
}
