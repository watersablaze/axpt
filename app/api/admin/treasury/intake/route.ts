import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

type IntakeType = 'TRANSFER_REVIEW' | 'BALANCE_DISCREPANCY' | 'SYNC_ISSUE' | 'OTHER'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, description, priority, affectedAssets }: {
      type: IntakeType
      description: string
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      affectedAssets: string[]
    } = body

    // Create a treasury intake record or case
    // For now, just log it - you might want to create a proper case or alert
    console.log('Treasury Intake:', {
      type,
      description,
      priority,
      affectedAssets,
      timestamp: new Date().toISOString()
    })

    // You could create a case here, or send an alert, etc.
    // For now, just return success

    return NextResponse.json({
      ok: true,
      message: 'Treasury intake submitted successfully'
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}