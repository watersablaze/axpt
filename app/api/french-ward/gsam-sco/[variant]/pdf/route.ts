import { NextResponse } from "next/server";
import { getAuthorizedFrozenGsamDocument } from "@/domains/instruments/transaction-documents/gsamRecipientFrozenDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{variant: string}> }) {
  try {
    const { variant } = await params;
    const doc = await getAuthorizedFrozenGsamDocument(variant, "pdf");
    if (!doc) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(new Uint8Array(doc.bytes), {
      status: 200,
      headers: {
        "Content-Type": doc.contentType,
        "Content-Disposition": `attachment; filename="${doc.fileStem}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("[GSAM frozen PDF] failed closed", error instanceof Error ? error.name : "unknown");
    return new NextResponse("Document unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
