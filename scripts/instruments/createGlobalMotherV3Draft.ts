import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { globalMotherV2Definition } from "../../src/domains/instruments/definitions/globalMotherV2Definition";
import { globalMotherV3Definition } from "../../src/domains/instruments/definitions/globalMotherV3Definition";
import { createInstrumentDraftVersionWithClient } from "../../src/domains/instruments/commands/createInstrumentDraftVersionWithClient";
import { replaceInstrumentDraftPropositionsWithClient } from "../../src/domains/instruments/commands/replaceInstrumentDraftPropositionsWithClient";
import { runInstrumentGovernanceTransaction } from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma = new PrismaClient();
const fingerprint = (items: readonly { reference: string; title: string; body: string }[]) =>
  JSON.stringify(items.map(item => [item.reference, item.title, item.body]));
async function main() {
  const result = await runInstrumentGovernanceTransaction(prisma, async tx => {
    const instrument = await tx.institutionalInstrument.findUnique({
      where: { reference: globalMotherV3Definition.reference },
      select: { createdByUserId: true, currentVersion: true, status: true,
        versions: { orderBy: { number: "asc" }, select: {
          id: true, number: true, status: true, issuedAt: true,
          propositions: { orderBy: { ordinal: "asc" }, select: {
            reference: true, title: true, body: true,
          } },
        } },
      },
    });
    const source = instrument?.versions.find((item: { number: number }) => item.number === 2);
    const existing = instrument?.versions.find((item: { number: number }) => item.number === 3);
    if (!instrument || instrument.currentVersion !== 2 || instrument.status !== "UNDER_DELIBERATION" ||
        !source || source.id !== "cmu8xeoht0001w0x02ma7zyqo" || source.status !== "ISSUED" ||
        !source.issuedAt || fingerprint(source.propositions) !== fingerprint(globalMotherV2Definition.propositions)) {
      throw new Error("GM_V3_DRAFT_SOURCE_PRECONDITION_FAILED");
    }
    if (existing) {
      if (existing.status !== "DRAFT" || existing.issuedAt ||
          fingerprint(existing.propositions) !== fingerprint(globalMotherV3Definition.propositions)) {
        throw new Error("GM_V3_EXISTING_VERSION_MISMATCH");
      }
      return { versionId: existing.id, number: 3, count: existing.propositions.length, repeated: true };
    }
    if (instrument.versions.some((item: { number: number; status: string }) => item.number > 2 || item.status === "DRAFT")) {
      throw new Error("GM_V3_UNEXPECTED_VERSION_EXISTS");
    }
    const created = await createInstrumentDraftVersionWithClient({
      client: tx, instrumentReference: globalMotherV3Definition.reference,
      createdByUserId: instrument.createdByUserId, sourceVersionNumber: 2, correlationId: randomUUID(),
    });
    if (created.draft.number !== 3) throw new Error("GM_V3_DRAFT_NUMBER_MISMATCH");
    const replaced = await replaceInstrumentDraftPropositionsWithClient({
      client: tx, instrumentReference: globalMotherV3Definition.reference,
      versionNumber: 3, propositions: globalMotherV3Definition.propositions,
    });
    if (replaced.version.id !== created.draft.id || replaced.currentVersion !== 2 ||
        fingerprint(replaced.version.propositions) !== fingerprint(globalMotherV3Definition.propositions)) {
      throw new Error("GM_V3_DRAFT_POSTCONDITION_FAILED");
    }
    return { versionId: replaced.version.id, number: 3, count: replaced.version.propositions.length, repeated: false };
  });
  console.log("GM_V3_EIGHT_INTENTION_DRAFT_READY", result);
}
main().catch(error => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
