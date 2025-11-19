import "server-only";
import { db } from "@/lib/db";

export async function getLiveState() {
  const row = await db.liveStream.findUnique({
    where: { id: "primary" },
  });

  return {
    isLive: row?.isLive ?? false,
    owncastHls: process.env.OWNC_HLS_URL!,
    fallbackHls: process.env.CF_HLS_URL || process.env.OWNC_HLS_URL!,
  };
}