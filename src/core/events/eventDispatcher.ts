// src/core/events/eventDispatcher.ts
import { prisma } from "@/lib/prisma";
import { projectNotification } from "./projectors/notificationProjector";
import { projectCaseReadModel } from "./projectors/caseReadModelProjector";

type DomainEventRecord = {
  id: string;
  streamType: string;
  streamId: string;
  eventType: string;
  payload: any;
  metadata: any;
  occurredAt: Date;
  createdAt: Date;
};

const projectors = [projectNotification, projectCaseReadModel];

export async function dispatchDomainEvents(limit = 50) {
  const events = await prisma.domainEvent.findMany({
    where: {
      processedAt: null,
      failedAt: null,
    },
    orderBy: {
      occurredAt: "asc",
    },
    take: limit,
  });

  for (const event of events as DomainEventRecord[]) {
    try {
      for (const projector of projectors) {
        await projector(event);
      }

      await prisma.domainEvent.update({
        where: { id: event.id },
        data: {
          processedAt: new Date(),
          failedAt: null,
          errorMessage: null,
        },
      });
    } catch (err: any) {
      await prisma.domainEvent.update({
        where: { id: event.id },
        data: {
          failedAt: new Date(),
          errorMessage: err?.message ?? "Unknown dispatcher failure",
        },
      });
    }
  }

  return {
    processed: events.length,
  };
}