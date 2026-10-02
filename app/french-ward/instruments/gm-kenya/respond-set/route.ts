import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { getGlobalMotherPrincipal } from "@/domains/instruments/access/globalMotherRecipientAuth";
import { institutionalInstrumentAccessCookieName } from "@/domains/instruments/access/accessToken";
import { globalMotherV4Definition } from "@/domains/instruments/definitions/globalMotherV4Definition";
import { resolveInstitutionalInstrumentAccessWithClient } from "@/domains/instruments/queries/resolveInstitutionalInstrumentAccessWithClient";
import { runInstrumentGovernanceTransaction } from "@/domains/instruments/governance/runInstrumentGovernanceTransaction";
import { submitGlobalMotherV2ResponseSetWithClient, type GlobalMotherPosition } from "@/domains/instruments/commands/submitGlobalMotherV2ResponseSetWithClient";

async function accessToken() {
  const jar = await cookies();
  return jar.get(institutionalInstrumentAccessCookieName(globalMotherV4Definition.reference))?.value ?? null;
}

function receiptPayload(receipt: {
  id: string; versionId: string; actorUserId: string; representedInstitution: string;
  representativeCapacity: string; positions: unknown; recordedAt: Date;
}) {
  return { id: receipt.id, versionId: receipt.versionId, actorUserId: receipt.actorUserId,
    representedInstitution: receipt.representedInstitution,
    representativeCapacity: receipt.representativeCapacity,
    positions: receipt.positions, recordedAt: receipt.recordedAt.toISOString() };
}

export async function GET() {
  const token = await accessToken();
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });
  const access = await resolveInstitutionalInstrumentAccessWithClient({
    client: prisma, instrumentReference: globalMotherV4Definition.reference,
    token, recordAccess: false,
  });
  const principal = await getGlobalMotherPrincipal();
  if (access?.instrument.currentVersion !== globalMotherV4Definition.version ||
      !access?.grant.recipientUserId || !access.grant.instrumentVersionId ||
      principal?.userId !== access.grant.recipientUserId) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const receipt = await prisma.instrumentResponseSet.findUnique({
    where: { versionId_actorUserId: {
      versionId: access.grant.instrumentVersionId, actorUserId: access.grant.recipientUserId,
    } },
  });
  return NextResponse.json({ ok: true, receipt: receipt ? receiptPayload(receipt) : null });
}

export async function POST(request: Request) {
  const token = await accessToken();
  if (!token) return NextResponse.json({ ok: false, error: "ACCESS_REQUIRED" }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ ok: false, error: "ORIGIN_REQUIRED" }, { status: 403 });
  const principal = await getGlobalMotherPrincipal();
  const access = await resolveInstitutionalInstrumentAccessWithClient({
    client: prisma, instrumentReference: globalMotherV4Definition.reference,
    token, recordAccess: false,
  });
  if (!principal || !access?.grant.recipientUserId ||
      principal.userId !== access.grant.recipientUserId || !access.grant.instrumentVersionId)
    return NextResponse.json({ ok: false, error: "RECIPIENT_SESSION_REQUIRED" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (typeof input.submissionKey !== "string" || !Array.isArray(input.positions) ||
      input.positions.some(value => !value || typeof value !== "object" || Array.isArray(value))) {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  try {
    const result = await runInstrumentGovernanceTransaction(prisma, tx =>
      submitGlobalMotherV2ResponseSetWithClient({
        client: tx, token, submissionKey: input.submissionKey as string,
        positions: input.positions as GlobalMotherPosition[], correlationId: randomUUID(),
      }),
      { timeoutMs: 30000 },
    );
    return NextResponse.json({ ok: true, repeated: result.repeated, receipt: receiptPayload(result.receipt) });
  } catch (error) {
    /* Concurrent retry may race the unique receipt insert. Re-read through the
       same command to verify its key and content before returning that receipt. */
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      try {
        const result = await runInstrumentGovernanceTransaction(prisma, tx =>
          submitGlobalMotherV2ResponseSetWithClient({
            client: tx, token, submissionKey: input.submissionKey as string,
            positions: input.positions as GlobalMotherPosition[], correlationId: randomUUID(),
          }),
          { timeoutMs: 30000 },
        );
        if (result.repeated) return NextResponse.json({ ok: true, repeated: true, receipt: receiptPayload(result.receipt) });
      } catch { /* Report the original conflict below. */ }
    }
    const message = error instanceof Error ? error.message : "";
    const status = message.includes("ALREADY_RECORDED") ||
      (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") ? 409 :
      message.includes("ACCESS") ? 403 :
      message.includes("INVALID") || message.includes("NOTE_REQUIRED") || message.includes("VERSION_MISMATCH") ? 400 : 500;
    if (status === 500) console.error("[gm/respond-set] submission failed", error);
    return NextResponse.json({ ok: false, error: status === 500 ? "RECORDING_FAILED" : message }, { status });
  }
}
