// app/api/admin/treasury/timeline/route.ts

import { prisma } from '@/infrastructure/db/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const events = await prisma.circuitEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

interface TimelineEvent {
    id: string
    type: string
    severity: string
    message: string
    metadata: unknown
    createdAt: string
}

interface TimelineResponse {
    ok: boolean
    data: TimelineEvent[]
}

return NextResponse.json<TimelineResponse>({
    ok: true,
    data: events.map((event: typeof events[number]) => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        message: event.message,
        metadata: event.metadata,
        createdAt: event.createdAt.toISOString(),
    })),
})
}
