import { NextResponse } from 'next/server'
import { getScenarioHistoryStats } from '@/domains/learning/strategyLearning'

export async function GET() {
  const stats = await getScenarioHistoryStats('STABILIZE_SYSTEM')

  return NextResponse.json({
    ok: true,
    data: Object.values(stats),
  })
}