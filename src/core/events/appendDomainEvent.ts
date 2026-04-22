import { prisma } from "@/lib/prisma"

type AppendEventInput = {
  streamType: string
  streamId: string
  eventType: string
  payload: any
  metadata?: any
}

export async function appendDomainEvent({
  streamType,
  streamId,
  eventType,
  payload,
  metadata
}: AppendEventInput) {

  return prisma.domainEvent.create({
    data: {
      streamType,
      streamId,
      eventType,
      payload,
      metadata
    }
  })
}