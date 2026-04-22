import { getTreasuryPulse } from "@/lib/treasury/pulse"

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pulse = await getTreasuryPulse();
    return Response.json(pulse, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Treasury pulse failed";

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}