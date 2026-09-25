import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import {
  INDERAKSH_TRANSACTION_REFERENCE,
} from "@/domains/instruments/definitions/inderakshTransactionContinuity";
import {
  publishReviewTransactionDocument,
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

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const principal = await getPrincipal();

    if (!principal) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const allowed =
      principal.roles.includes("ADMIN_PLATFORM") ||
      principal.roles.includes("ADMIN") ||
      principal.permissions.includes("admin.access");

    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const { reference, kind: rawKind } = await context.params;
    const kind = normalizeKind(rawKind);

    if (
      reference !== INDERAKSH_TRANSACTION_REFERENCE ||
      !kind
    ) {
      return NextResponse.json(
        { ok: false, error: "DOCUMENT_REFERENCE_NOT_ALLOWED" },
        { status: 400 },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("application/pdf")) {
      return NextResponse.json(
        { ok: false, error: "PDF_REQUIRED" },
        { status: 415 },
      );
    }

    const pdf = new Uint8Array(await request.arrayBuffer());

    if (pdf.byteLength < 5 || new TextDecoder().decode(pdf.slice(0, 5)) !== "%PDF-") {
      return NextResponse.json(
        { ok: false, error: "INVALID_PDF_SIGNATURE" },
        { status: 400 },
      );
    }

    if (pdf.byteLength > 25 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "PDF_TOO_LARGE" },
        { status: 413 },
      );
    }

    const record = await publishReviewTransactionDocument({
      transactionReference: reference,
      documentKind: kind,
      pdf,
      uploadedBy: principal.email,
    });

    return NextResponse.json({
      ok: true,
      record: {
        ...record,
        issuedAt: record.issuedAt?.toISOString() ?? null,
        executedAt: record.executedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[TRANSACTION_DOCUMENT_ISSUANCE_FAILED]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "TRANSACTION_DOCUMENT_ISSUANCE_FAILED",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
