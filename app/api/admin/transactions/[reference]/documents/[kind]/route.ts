import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import {
  INDERAKSH_TRANSACTION_REFERENCE,
} from "@/domains/instruments/definitions/inderakshTransactionContinuity";
import {
  loadIssuedTransactionDocument,
  privateTransactionDocumentStore,
  type TransactionDocumentRecord,
} from "@/domains/instruments/transaction-documents/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    reference: string;
    kind: string;
  }>;
};

function normalizeKind(
  value: string,
): TransactionDocumentRecord["documentKind"] | null {
  if (value === "SPA" || value === "COMMERCIAL_SCHEDULE") {
    return value;
  }

  return null;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };

  const principal = await getPrincipal();

  if (!principal) {
    return new NextResponse(null, { status: 401, headers });
  }

  const allowed =
    principal.roles.includes("ADMIN_PLATFORM") ||
    principal.roles.includes("ADMIN") ||
    principal.permissions.includes("admin.access");

  if (!allowed) {
    return new NextResponse(null, { status: 403, headers });
  }

  const { reference, kind: rawKind } = await context.params;
  const kind = normalizeKind(rawKind);

  if (
    reference !== INDERAKSH_TRANSACTION_REFERENCE ||
    !kind
  ) {
    return new NextResponse(null, { status: 404, headers });
  }

  const record = await loadIssuedTransactionDocument(reference, kind);
  const store = privateTransactionDocumentStore();

  if (
    !record ||
    !store ||
    record.status === "DRAFT" ||
    record.status === "SUPERSEDED"
  ) {
    return NextResponse.json(
      { error: "Document attachment is not yet available." },
      { status: 404, headers },
    );
  }

  const pdf = await store.read(record.storageKey);
  const sha256 = createHash("sha256").update(pdf).digest("hex");

  if (sha256 !== record.sha256) {
    return NextResponse.json(
      { error: "Document integrity check failed." },
      { status: 503, headers },
    );
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
