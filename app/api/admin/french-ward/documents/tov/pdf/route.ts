import { getAdminFrozenTovPdf } from "@/domains/institutions/french-ward/documents/getAdminFrozenTovPdf";
import { respondWithFrozenTovPdf } from "@/domains/institutions/french-ward/documents/respondWithFrozenTovPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// No route-scoped test identity, token fallback, or email verification bypass.
// All authorization still originates in getAdminFrozenTovPdf.
export async function GET() {
  return respondWithFrozenTovPdf(getAdminFrozenTovPdf, (error) => {
    console.error("[FW TOV frozen PDF] read failed", error instanceof Error ? error.name : "unknown");
  });
}
