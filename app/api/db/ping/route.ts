// 📁 app/api/db/ping/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs' // ensure not edge for db access

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', message: 'Database awake' })
  } catch (e) {
    return NextResponse.json(
      { status: 'error', error: String(e) },
      { status: 500 }
    )
  }
}