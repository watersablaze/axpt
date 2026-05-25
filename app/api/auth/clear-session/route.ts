import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/shared/constants/cookies'

export async function POST(_req: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '[AXPT] Session cleared.',
    })

    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    })

    return response
  } catch (err) {
    console.error(
      '[AXPT] ❌ Failed to clear session:',
      err
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear session.',
      },
      { status: 500 }
    )
  }
}