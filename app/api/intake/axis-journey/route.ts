import { NextResponse } from 'next/server';

// Historical AXIS Journey intake is not operational.
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'AXIS_JOURNEY_INTAKE_NOT_OPERATIONAL',
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
