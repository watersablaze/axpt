import { NextResponse } from "next/server";
import { getAdminFrozenTovPdf } from "@/domains/institutions/french-ward/documents/getAdminFrozenTovPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const doc = await getAdminFrozenTovPdf();
    if (!doc) return new NextResponse("Not found", {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
    return new NextResponse(new Uint8Array(doc.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.filename}"`,
        "Content-Length": String(doc.bytes.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("[FW TOV frozen PDF] read failed", error instanceof Error ? error.name : "unknown");
    return new NextResponse("Document unavailable", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
