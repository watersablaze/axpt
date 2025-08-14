// FILE: lib/logging/logEvent.ts
import { prisma } from '@/lib/prisma';

export async function logEvent(input: {
  userId: string;
  action: string;
  path: string;
  ip?: string;
  device?: string;
}) {
  const { userId, ...rest } = input;

  try {
    // Check if the user exists
    const exists = await prisma.user.findUnique({ where: { id: userId } });
    if (!exists) {
      console.warn(`[logEvent] ⚠️ Skipping log: User ${userId} not found`);
      return;
    }

    await prisma.sessionLog.create({
      data: {
        user: { connect: { id: userId } },
        ...rest,
      },
    });
  } catch (err) {
    console.error('[logEvent] ❌ Failed to log event:', err);
  }
}