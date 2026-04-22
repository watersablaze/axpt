import { prisma } from '@/infrastructure/db/prisma';

type LogEmailInput = {
  type: string;
  to: string;
  from: string;
  subject: string;
  messageId: string;
  status: string;
  eventRaw: any;
};

export async function logEmailEvent({
  type,
  to,
  from,
  subject,
  messageId,
  status,
  eventRaw,
}: LogEmailInput) {
  try {
    // Only include columns that actually exist in the Prisma EmailLog model
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        status,
        rawPayload: eventRaw,
      },
    });

    // Console trace for debug visibility
    console.log(`📬 Logged email event: ${type} → ${to}`);
  } catch (err) {
    console.error('❌ Error logging email event:', err);
  }
}