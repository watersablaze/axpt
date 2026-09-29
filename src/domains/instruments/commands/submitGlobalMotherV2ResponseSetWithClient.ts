import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { globalMotherV2Definition } from "../definitions/globalMotherV2Definition";
import { resolveInstitutionalInstrumentAccessWithClient } from "../queries/resolveInstitutionalInstrumentAccessWithClient";
import { submitInstrumentResponseWithTokenWithClient } from "./submitInstrumentResponseWithTokenWithClient";

export type GlobalMotherResponseSetClient = Pick<PrismaClient,
  "institutionalInstrument" | "instrumentVersion" | "instrumentProposition" |
  "instrumentAccessGrant" | "instrumentResponse" | "instrumentResponseSet" | "domainEvent">;

type Choice = "AFFIRM" | "CLARIFY" | "REVISE" | "DECLINE";
export type GlobalMotherPosition = Readonly<{
  reference: string;
  responseType: Choice;
  note?: string | null;
}>;

export async function submitGlobalMotherV2ResponseSetWithClient(params: {
  client: GlobalMotherResponseSetClient;
  token: string;
  submissionKey: string;
  positions: readonly GlobalMotherPosition[];
  correlationId: string;
}) {
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(params.submissionKey)) {
    throw new Error("[GM_RESPONSE_SET_KEY_INVALID]");
  }
  const expected = globalMotherV2Definition.propositions.map(item => item.reference);
  if (params.positions.length !== expected.length ||
      params.positions.some((item, index) => item.reference !== expected[index] ||
        !["AFFIRM", "CLARIFY", "REVISE", "DECLINE"].includes(item.responseType) ||
        typeof item.note !== "undefined" && item.note !== null && typeof item.note !== "string")) {
    throw new Error("[GM_RESPONSE_SET_POSITIONS_INVALID]");
  }
  const positions = params.positions.map(item => ({
    reference: item.reference,
    responseType: item.responseType,
    note: item.responseType === "AFFIRM" ? null : item.note?.trim() || null,
  }));
  if (positions.some(item => item.responseType !== "AFFIRM" && !item.note ||
      (item.note?.length ?? 0) > 4000)) {
    throw new Error("[GM_RESPONSE_SET_NOTE_REQUIRED_OR_TOO_LONG]");
  }
  const contentHash = createHash("sha256").update(JSON.stringify(positions)).digest("hex");
  const access = await resolveInstitutionalInstrumentAccessWithClient({
    client: params.client,
    instrumentReference: globalMotherV2Definition.reference,
    token: params.token,
    recordAccess: false,
  });
  if (!access?.grant.recipientUserId || !access.grant.instrumentVersionId ||
      !access.grant.representedInstitution || !access.grant.representativeCapacity ||
      !["RESPOND", "DELIBERATE"].includes(access.grant.accessLevel)) {
    throw new Error("[GM_RESPONSE_SET_BOUND_ACCESS_REQUIRED]");
  }
  const instrument = await params.client.institutionalInstrument.findUnique({
    where: { reference: globalMotherV2Definition.reference },
    select: { id: true, currentVersion: true,
      versions: { where: { number: globalMotherV2Definition.version },
        select: { id: true, status: true, propositions: {
          orderBy: { ordinal: "asc" }, select: { reference: true, body: true },
        } }, },
    },
  });
  const version = instrument?.versions[0];
  if (!instrument || instrument.currentVersion !== 2 || !version ||
      version.status !== "ISSUED" || access.grant.instrumentVersionId !== version.id ||
      JSON.stringify(version.propositions.map((item: { reference: string; body: string }) => [item.reference, item.body])) !==
        JSON.stringify(globalMotherV2Definition.propositions.map(item => [item.reference, item.body]))) {
    throw new Error("[GM_RESPONSE_SET_VERSION_MISMATCH]");
  }
  const previous = await params.client.instrumentResponseSet.findUnique({
    where: { versionId_actorUserId: { versionId: version.id, actorUserId: access.grant.recipientUserId } },
  });
  if (previous) {
    if (previous.submissionKey !== params.submissionKey || previous.contentHash !== contentHash ||
        previous.grantId !== access.grant.id) {
      throw new Error("[GM_RESPONSE_SET_ALREADY_RECORDED]");
    }
    return { receipt: previous, repeated: true } as const;
  }
  const recorded = [];
  for (const position of positions) {
    const result = await submitInstrumentResponseWithTokenWithClient({
      client: params.client,
      instrumentReference: globalMotherV2Definition.reference,
      token: params.token,
      propositionReference: position.reference,
      responseType: position.responseType,
      note: position.note,
      correlationId: params.correlationId,
    });
    recorded.push({ ...position, responseId: result.response.response.id });
  }
  const receipt = await params.client.instrumentResponseSet.create({
    data: {
      instrumentId: instrument.id,
      versionId: version.id,
      grantId: access.grant.id,
      actorUserId: access.grant.recipientUserId,
      submissionKey: params.submissionKey,
      contentHash,
      representedInstitution: access.grant.representedInstitution,
      representativeCapacity: access.grant.representativeCapacity,
      positions: recorded,
    },
  });
  await params.client.domainEvent.create({
    data: {
      streamType: "INSTITUTIONAL_INSTRUMENT",
      streamId: instrument.id,
      eventType: "INSTRUMENT_RESPONSE_SET_RECORDED",
      payload: { receiptId: receipt.id, versionId: version.id, responseIds: recorded.map(item => item.responseId) },
      metadata: { actorUserId: access.grant.recipientUserId, accessGrantId: access.grant.id,
        correlationId: params.correlationId, source: "gm.v2.response-set" },
    },
  });
  return { receipt, repeated: false } as const;
}
