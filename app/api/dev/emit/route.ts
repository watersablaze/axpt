import { NextResponse } from 'next/server'

import { appendDomainEvent } from '@/core/events/appendDomainEvent'

import type {
  EventType,
} from '@/core/events/types'

export async function POST(req: Request) {
  const {
    type,
    streamType,
    streamId,
    payload,
    metadata,
  } = await req.json()

  const eventType = type as EventType

  await appendDomainEvent({
    streamType:
      streamType ?? 'SYSTEM',

    streamId:
      streamId ?? crypto.randomUUID(),

    eventType,

    payload:
      payload ?? {},

    metadata: {
      source: 'dev.injector',
      ...(metadata ?? {}),
    },
  })

  return NextResponse.json({
    ok: true,
  })
}