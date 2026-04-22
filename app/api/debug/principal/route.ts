// app/api/debug/principal/route.ts

import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'

export async function GET() {
  const principal = await getPrincipal()

  return NextResponse.json({
    ok: true,
    principal,
  })
}