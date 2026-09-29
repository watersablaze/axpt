import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { INSTRUMENT_EVENT_TYPE } from "@/domains/instruments/eventTypes";
import { globalMotherV2Definition } from "@/domains/instruments/definitions/globalMotherV2Definition";
import { runInstrumentGovernanceTransaction } from "@/domains/instruments/governance/runInstrumentGovernanceTransaction";

import { globalMotherDraftingGate, validateGlobalMotherDraftingDispositions } from "@/domains/instruments/invariants/globalMotherDraftingGate";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "ORIGIN_REQUIRED" }, { status: 403 });
  const principal = await getPrincipal();
  if (!isAdmin(principal) || !principal)
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  const input = body && typeof body === "object" && !Array.isArray(body)
    ? body as Record<string, unknown> : null;
  const standing = input?.standing;
  const rationale = typeof input?.rationale === "string" ? input.rationale.trim() : "";
  const ids = input?.reviewedReceiptIds;
  if (!input || (standing !== "REVIEW_HOLD" && standing !== "OPEN_DRAFTING") ||
      typeof input.versionId !== "string" ||
      !Array.isArray(ids) || ids.some(id => typeof id !== "string") ||
      new Set(ids).size !== ids.length || rationale.length < 20 || rationale.length > 2000 ||
      typeof input.decisionKey !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(input.decisionKey) ||
      input.confirmation !== "RECORD DRAFTING DECISION")
    return NextResponse.json({ error: "DECISION_INPUT_INVALID" }, { status: 400 });
  try {
    const decision = await runInstrumentGovernanceTransaction(prisma, async tx => {
      // Idempotency compares the exact persisted basis, including issue dispositions.
      const requestedDispositions = Array.isArray(input.dispositions) ? input.dispositions : [];
      const existing = await tx.globalMotherDraftingDecision.findUnique({
        where: { decisionKey: input.decisionKey as string },
      });
      if (existing) {
        if (existing.actorUserId !== principal.userId || existing.versionId !== input.versionId ||
            existing.standing !== standing || !existing.rationale.startsWith(rationale + "\n\nDrafting dispositions: ") ||
            JSON.stringify(existing.reviewedReceiptIds) !== JSON.stringify(ids))
          throw new Error("DECISION_KEY_CONFLICT");
        const savedDispositions = existing.rationale.slice((rationale + "\n\nDrafting dispositions: ").length);
        if (savedDispositions !== JSON.stringify(requestedDispositions.slice().sort((a, b) =>
          `${a.receiptId}:${a.reference}`.localeCompare(`${b.receiptId}:${b.reference}`)))) throw new Error("DECISION_KEY_CONFLICT");
        return existing;
      }
      const instrument = await tx.institutionalInstrument.findUnique({
        where: { reference: globalMotherV2Definition.reference },
        select: { id: true, currentVersion: true,
          versions: { where: { number: 2, status: "ISSUED" }, select: { id: true } },
        },
      });
      const version = instrument?.versions[0];
      if (!instrument || instrument.currentVersion !== 2 || !version || version.id !== input.versionId)
        throw new Error("VERSION_NOT_ISSUED");
      const receipts = await tx.instrumentResponseSet.findMany({
        where: { versionId: version.id }, select: { id: true, representedInstitution: true, positions: true },
      });
      const recordedIds = receipts.map((receipt: { id: string; representedInstitution: string }) => receipt.id).sort();
      const reviewedIds = (ids as string[]).slice().sort();
      if (JSON.stringify(recordedIds) !== JSON.stringify(reviewedIds))
        throw new Error("RECEIPT_REVIEW_INCOMPLETE");
      const gate = globalMotherDraftingGate(receipts);
      let dispositions = [] as NonNullable<ReturnType<typeof validateGlobalMotherDraftingDispositions>>;
      if (standing === "OPEN_DRAFTING") {
        if (gate.missingInstitutions.length) throw new Error("AOTG_AND_ND_ROYAL_RESPONSES_REQUIRED");
        if (gate.invalidResponses) throw new Error("RESPONSE_RECORD_INVALID");
        if (gate.issues.some(issue => issue.responseType === "DECLINE")) throw new Error("DECLINED_POSITION_REQUIRES_REVIEW");
        const validated = validateGlobalMotherDraftingDispositions(gate.issues, input.dispositions);
        if (!validated) throw new Error("OUTSTANDING_POSITION_TREATMENT_REQUIRED");
        dispositions = validated;
      } else if (requestedDispositions.length) throw new Error("DECISION_INPUT_INVALID");
      const recordedBasis = rationale + "\n\nDrafting dispositions: " + JSON.stringify(dispositions);
      const recorded = await tx.globalMotherDraftingDecision.create({ data: {
        instrumentId: instrument.id, versionId: version.id, actorUserId: principal.userId,
        decisionKey: input.decisionKey as string, standing, rationale: recordedBasis,
        reviewedReceiptIds: reviewedIds,
      } });
      await tx.domainEvent.create({ data: {
        streamType: "INSTITUTIONAL_INSTRUMENT", streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.GM_V2_DRAFTING_DECISION_RECORDED,
        payload: { decisionId: recorded.id, standing, versionId: version.id,
          reviewedReceiptIds: reviewedIds },
        metadata: { actorUserId: principal.userId, source: "gm-v2.operator.drafting-decision" },
      } });
      return recorded;
    }, { timeoutMs: 30000 });
    return NextResponse.json({ ok: true, decisionId: decision.id, standing: decision.standing });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (["DECISION_KEY_CONFLICT", "VERSION_NOT_ISSUED", "RECEIPT_REVIEW_INCOMPLETE",
      "AOTG_AND_ND_ROYAL_RESPONSES_REQUIRED", "RESPONSE_RECORD_INVALID",
      "DECLINED_POSITION_REQUIRES_REVIEW", "OUTSTANDING_POSITION_TREATMENT_REQUIRED", "DECISION_INPUT_INVALID"].includes(code))
      return NextResponse.json({ error: code }, { status: 409 });
    console.error("[gm-v2/drafting-decision] failed", error);
    return NextResponse.json({ error: "DECISION_RECORDING_FAILED" }, { status: 500 });
  }
}
