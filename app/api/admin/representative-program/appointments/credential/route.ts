import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import {
  loadAppointmentCertificateIssuanceBasis,
  issueRepresentativeAppointmentCredential,
} from "@/domains/instruments/representative-program/application/issueRepresentativeAppointmentCredential";
import {
  SIGNATURE_HASH,
  SEAL_HASH,
  renderIssuableAppointmentCertificate,
  storePrivateAppointmentCertificate,
} from "@/domains/instruments/representative-program/application/appointmentCertificateRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  appointmentId: z.string().trim().min(1).max(191),
  expectedBasisHash: z.string().regex(/^[a-f0-9]{64}$/),
  confirmIssue: z.literal(true),
}).strict();

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("ISSUER_REQUIRED")) {
    return json({ ok: false, error: "CERTIFICATE_ISSUER_REQUIRED" }, 403);
  }
  if (message.includes("NOT_FOUND")) {
    return json({ ok: false, error: "CERTIFICATE_NOT_FOUND" }, 404);
  }
  if (/STATE_CONFLICT|REVIEW_CHANGED|EVIDENCE_CONFLICT/.test(message)) {
    return json({ ok: false, error: "CERTIFICATE_RECORD_CONFLICT" }, 409);
  }
  console.error("[ARP_CERTIFICATE_OPERATION_FAILED]");
  return json({ ok: false, error: "CERTIFICATE_UNAVAILABLE" }, 503);
}

export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  if (!isAdmin(principal)) return json({ ok: false }, 403);

  const query = new URL(request.url).searchParams;
  const appointmentId = query.get("appointmentId")?.trim();
  if (
    !appointmentId || appointmentId.length > 191 ||
    query.getAll("appointmentId").length !== 1 ||
    [...query.keys()].some(key => key !== "appointmentId")
  ) return json({ ok: false, error: "INVALID_REQUEST" }, 400);

  try {
    const review = await loadAppointmentCertificateIssuanceBasis({
      client: prisma,
      appointmentId,
      actorUserId: principal.userId,
    });
    return json({ ok: true, review }, 200);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  if (!isAdmin(principal)) return json({ ok: false }, 403);

  let body: unknown;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: "INVALID_REQUEST" }, 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: "INVALID_REQUEST" }, 400);
  }

  try {
    const issuance = await issueRepresentativeAppointmentCredential({
      ...parsed.data,
      client: prisma,
      actorUserId: principal.userId,
      signatureHash: SIGNATURE_HASH,
      sealHash: SEAL_HASH,
      render: renderIssuableAppointmentCertificate,
      store: storePrivateAppointmentCertificate,
    });
    return json({ ok: true, issuance }, 200);
  } catch (error) {
    return failure(error);
  }
}
