import { prisma } from "@/infrastructure/db/prisma";

export async function getLiveState(streamId: string) {
  const row = await prisma.liveStream.findUnique({
    where: { streamId },
  });

  return row ?? null;
}