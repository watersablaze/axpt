import type { PrismaClient } from "@prisma/client";
import { globalMotherV3Definition } from "../definitions/globalMotherV3Definition";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type GlobalMotherV2IssuanceClient = Pick<PrismaClient,
  "institutionalInstrument" | "instrumentVersion" | "domainEvent">;

export async function issueGlobalMotherV2WithClient(params: {
  client: GlobalMotherV2IssuanceClient;
  actorUserId: string;
  expectedVersionId: string;
}) {
  const instrument = await params.client.institutionalInstrument.findUnique({
    where: { reference: globalMotherV3Definition.reference },
    select: { id: true, currentVersion: true, status: true,
      versions: { where: { number: globalMotherV3Definition.version }, select: {
        id: true, status: true, issuedAt: true,
        propositions: { orderBy: { ordinal: "asc" }, select: {
          reference: true, body: true, responses: { select: { id: true }, take: 1 },
        } },
      } },
    },
  });
  const version = instrument?.versions[0];
  if (!instrument || !version || version.id !== params.expectedVersionId ||
      instrument.currentVersion !== 2 || instrument.status !== "UNDER_DELIBERATION" ||
      version.status !== "DRAFT" || version.issuedAt !== null ||
      version.propositions.some((item: { responses: readonly { id: string }[] }) => item.responses.length !== 0) ||
      JSON.stringify(version.propositions.map((item: { reference: string; body: string }) => [item.reference, item.body])) !==
        JSON.stringify(globalMotherV3Definition.propositions.map(item => [item.reference, item.body]))) {
    throw new Error("[GM_V2_ISSUANCE_PRECONDITION_FAILED]");
  }
  const issuedAt = new Date();
  const updated = await params.client.institutionalInstrument.updateMany({
    where: { id: instrument.id, currentVersion: 2, status: "UNDER_DELIBERATION" },
    data: { currentVersion: globalMotherV3Definition.version },
  });
  if (updated.count !== 1) throw new Error("[GM_V2_ISSUANCE_CONCURRENT_CHANGE]");
  const changed = await params.client.instrumentVersion.updateMany({
    where: { id: version.id, status: "DRAFT", issuedAt: null },
    data: { status: "ISSUED", issuedAt },
  });
  if (changed.count !== 1) throw new Error("[GM_V2_ISSUANCE_CONCURRENT_VERSION_CHANGE]");
  await params.client.domainEvent.create({
    data: {
      streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: instrument.id,
      eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_ISSUED,
      payload: { versionId: version.id, versionNumber: globalMotherV3Definition.version, issuedAt: issuedAt.toISOString() },
      metadata: { actorUserId: params.actorUserId, source: "gm-v3.operator.issue" },
      occurredAt: issuedAt,
    },
  });
  return { versionId: version.id, issuedAt };
}
