import { prisma } from "@/lib/prisma";

export async function getLiveState(streamId: string) {
  const row = await prisma.liveStream.findUnique({
    where: { streamId },
  });

  return row ?? null;
}