import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeSupportingDocumentWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/loadRepresentativeSupportingDocumentWithClient";
import { readSupportingDocument } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/readSupportingDocument";
import { readPrivateSupportingBlob } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/readPrivateSupportingBlob";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" };
export async function GET(request: Request, context: { params: Promise<{ resourceReleaseId: string }> }) {
  const principal = await getPrincipal();
  if (!principal) return new NextResponse(null, { status: 401, headers });
  const { resourceReleaseId } = await context.params;
  const mode = new URL(request.url).searchParams.get("mode") ?? "inline";
  if (!["inline", "download"].includes(mode)) return new NextResponse(null, { status: 400, headers });
  try {
    const result = await readSupportingDocument({ action: mode === "download" ? "DOWNLOAD" : "VIEW",
      authorize: () => loadRepresentativeSupportingDocumentWithClient({ client: prisma, userId: principal.userId, resourceReleaseId }),
      read: readPrivateSupportingBlob });
    if (!result) return new NextResponse(null, { status: 404, headers });
    const fileName = `${result.reference}-v${result.version}.pdf`.replace(/[^a-zA-Z0-9._-]/g,"_");
    return new NextResponse(Buffer.from(result.bytes), { headers: { ...headers, "Content-Type": "application/pdf",
      "Content-Disposition": `${mode === "download" ? "attachment" : "inline"}; filename="${fileName}"`,
      "Content-Length": String(result.bytes.byteLength) } });
  } catch { console.error("[ARP_SUPPORTING_DOCUMENT_READ_FAILED]"); return new NextResponse(null, { status: 503, headers }); }
}
