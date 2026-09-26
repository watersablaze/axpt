import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { instrumentAccessCookieName } from "@/domains/instruments/access/accessToken";
import { DSI_REFERENCE } from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { resolveDigitalSettlementV2Audience } from "@/domains/instruments/definitions/digitalSettlementV2Audience";
import { INDERAKSH_TRANSACTION_REFERENCE } from "@/domains/instruments/definitions/inderakshTransactionContinuity";
import { loadIssuedDigitalSettlementInstruction } from "@/domains/instruments/queries/loadIssuedDigitalSettlementInstruction";
import { resolveInstrumentAccess } from "@/domains/instruments/queries/resolveInstrumentAccess";
import {
  loadIssuedTransactionDocument,
  privateTransactionDocumentStore,
} from "@/domains/instruments/transaction-documents/contracts";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ publicId: string; kind: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { publicId, kind } = await params;
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (kind !== "SPA" && kind !== "COMMERCIAL_SCHEDULE") {
    return new NextResponse(null, { status: 404, headers });
  }
  const token = (await cookies()).get(instrumentAccessCookieName(publicId))?.value;
  const access = token
    ? await resolveInstrumentAccess({ publicId, token })
    : null;
  const audience = access
    ? resolveDigitalSettlementV2Audience(access.recipientName)
    : null;

  if (!access || !audience?.canViewDocuments) {
    return new NextResponse(null, { status: 404, headers });
  }
  const instruction = await loadIssuedDigitalSettlementInstruction(publicId);
  if (instruction?.reference !== DSI_REFERENCE) {
    return new NextResponse(null, { status: 404, headers });
  }
  const record = await loadIssuedTransactionDocument(INDERAKSH_TRANSACTION_REFERENCE, kind);
  const store = privateTransactionDocumentStore();
  if (!record || !store || record.status === "DRAFT" || record.status === "SUPERSEDED") {
    return NextResponse.json({ error: "Document attachment is not yet available." }, { status: 503, headers });
  }
  const pdf = await store.read(record.storageKey);
  if (createHash("sha256").update(pdf).digest("hex") !== record.sha256) {
    return NextResponse.json({ error: "Document integrity check failed." }, { status: 503, headers });
  }
  const mode = request.nextUrl.searchParams.get("mode");
  const disposition = mode === "download" ? "attachment" : "inline";
  const safeName = record.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${safeName}"`,
      "Content-Length": String(pdf.byteLength),
    },
  });
}
