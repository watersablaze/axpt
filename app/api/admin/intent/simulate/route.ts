import { NextResponse } from 'next/server'
import { simulateIntent } from '@/domains/simulation/simulateIntent'

export async function POST(req: Request) {
  const body = await req.json()

  const result = await simulateIntent(body.intent, body.context)

  return NextResponse.json({ ok: true, data: result })
}
