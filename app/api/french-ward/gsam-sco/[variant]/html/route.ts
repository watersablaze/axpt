import { NextResponse } from "next/server";
import { getAuthorizedFrozenGsamDocument } from "@/domains/instruments/transaction-documents/gsamRecipientFrozenDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{variant: string}> }) {
  try {
    const { variant } = await params;
    const doc = await getAuthorizedFrozenGsamDocument(variant, "html");
    if (!doc) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(new Uint8Array(doc.bytes), {
      status: 200,
      headers: {
        "Content-Type": doc.contentType,
        "Content-Disposition": `inline; filename="${doc.fileStem}.html"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
        // Frozen viewing is isolated from app scripts and network resources.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox",
      },
    });
  } catch (error) {
    console.error("[GSAM frozen HTML] failed closed", error instanceof Error ? error.name : "unknown");
    return new NextResponse("Document unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
