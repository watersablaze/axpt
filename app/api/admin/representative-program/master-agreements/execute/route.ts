import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_EVIDENCE_SUBJECT,
  INSTRUMENT_EVIDENCE_TYPE,
} from "@/domains/instruments/contracts";
import { vercelPrivateMasterAgreementStore } from "@/domains/instruments/representative-program/onboarding/application/vercelPrivateMasterAgreementStore";
import { assembleMasterAgreementEvidence } from "@/domains/instruments/representative-program/onboarding/commands/assembleMasterAgreementEvidence";
import { recordMasterAgreementExecution } from "@/domains/instruments/representative-program/onboarding/commands/recordMasterAgreementExecution";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 4_200_000;
const MAX_PDF_BYTES = 4_000_000;

const fieldsSchema = z.object({
  reference: z.string().trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/),
  signerEmail: z.string().trim().email().max(320),
  adobeAgreementId: z.string().trim().min(1).max(200),
  completedAt: z.string().datetime({ offset: true }),
  operatorConfirmedAllSignatures: z.literal("true"),
}).strict();

function jsonNoStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function designatedEmail(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const email = (metadata as Record<string, unknown>).candidateEmail;
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) {
    return jsonNoStore({ ok: false, error: "UNAUTHORIZED" }, 401);
  }
  if (!isAdmin(principal)) {
    return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonNoStore({ ok: false, error: "PDF_PACKAGE_TOO_LARGE" }, 413);
  }
  if (
    !request.headers.get("content-type")
      ?.toLowerCase()
      .startsWith("multipart/form-data;")
  ) {
    return jsonNoStore({ ok: false, error: "MULTIPART_REQUIRED" }, 415);
  }

  try {
    // Match the domain command's database-level admin requirement before
    // accepting files or creating private objects.
    const actor = await prisma.user.findUnique({
      where: { id: principal.userId },
      select: { isAdmin: true },
    });
    if (!actor?.isAdmin) {
      return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonNoStore({ ok: false, error: "INVALID_FORM_DATA" }, 400);
    }

    const parsed = fieldsSchema.safeParse({
      reference: form.get("reference"),
      signerEmail: form.get("signerEmail"),
      adobeAgreementId: form.get("adobeAgreementId"),
      completedAt: form.get("completedAt"),
      operatorConfirmedAllSignatures:
        form.get("operatorConfirmedAllSignatures"),
    });

    if (!parsed.success) {
      return jsonNoStore(
        { ok: false, error: "EXECUTION_REVIEW_REQUIRED" },
        400,
      );
    }

    const signedPdf = form.get("signedPdf");
    const auditPdf = form.get("auditPdf");

    if (!(signedPdf instanceof File) || !(auditPdf instanceof File)) {
      return jsonNoStore(
        { ok: false, error: "SIGNED_PDF_AND_AUDIT_REQUIRED" },
        400,
      );
    }

    if (
      signedPdf.size === 0 ||
      auditPdf.size === 0 ||
      signedPdf.size + auditPdf.size > MAX_PDF_BYTES
    ) {
      return jsonNoStore(
        { ok: false, error: "PDF_PACKAGE_TOO_LARGE" },
        413,
      );
    }

    const reference = parsed.data.reference;
    const signerEmail = parsed.data.signerEmail.toLowerCase();

    // Reject wrong references and signers before storing any PDFs.
    const agreement = await prisma.institutionalInstrument.findUnique({
      where: { reference },
      select: {
        kind: true,
        status: true,
        evidence: {
          where: {
            evidenceType: INSTRUMENT_EVIDENCE_TYPE.ATTESTATION,
            subjectType: INSTRUMENT_EVIDENCE_SUBJECT.INSTRUMENT,
          },
          select: { metadata: true },
        },
      },
    });

    if (
      !agreement ||
      agreement.kind !==
        INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_PROGRAM_AGREEMENT
    ) {
      return jsonNoStore(
        { ok: false, error: "MASTER_AGREEMENT_NOT_FOUND" },
        404,
      );
    }

    if (
      agreement.status !== INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT &&
      agreement.status !== INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTED
    ) {
      return jsonNoStore(
        { ok: false, error: "MASTER_AGREEMENT_STATE_CONFLICT" },
        409,
      );
    }

    if (
      !agreement.evidence.some(
        (item: { metadata: unknown }) =>
          designatedEmail(item.metadata) === signerEmail,
      )
    ) {
      return jsonNoStore(
        { ok: false, error: "MASTER_AGREEMENT_SIGNER_MISMATCH" },
        409,
      );
    }

    const receipt = await assembleMasterAgreementEvidence({
      store: vercelPrivateMasterAgreementStore,
      reference,
      signerEmail,
      adobeAgreementId: parsed.data.adobeAgreementId,
      completedAt: new Date(parsed.data.completedAt),
      reviewedByUserId: principal.userId,
      reviewedAt: new Date(),
      operatorConfirmedAllSignatures: true,
      signedPdf: new Uint8Array(await signedPdf.arrayBuffer()),
      auditPdf: new Uint8Array(await auditPdf.arrayBuffer()),
    });

    const result = await recordMasterAgreementExecution({
      client: prisma,
      receipt,
    });

    return jsonNoStore({
      ok: true,
      agreement: {
        instrumentId: result.instrumentId,
        reference: result.reference,
        executed: result.executed,
      },
    }, 200);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("ARP_MASTER_AGREEMENT_ADMIN_REQUIRED")
    ) {
      return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
    }

    if (
      error instanceof Error &&
      error.message.startsWith("[ARP_MASTER_AGREEMENT_")
    ) {
      return jsonNoStore(
        { ok: false, error: "MASTER_AGREEMENT_EXECUTION_CONFLICT" },
        409,
      );
    }

    console.error("[ARP_MASTER_AGREEMENT_EXECUTION_ROUTE_FAILED]", error);
    return jsonNoStore(
      { ok: false, error: "MASTER_AGREEMENT_EXECUTION_FAILED" },
      500,
    );
  }
}
