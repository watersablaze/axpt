import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { globalMotherV2Definition } from "../../src/domains/instruments/definitions/globalMotherV2Definition";
import { replaceInstrumentDraftPropositionsWithClient } from "../../src/domains/instruments/commands/replaceInstrumentDraftPropositionsWithClient";
import { runInstrumentGovernanceTransaction } from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const previousDraftHash = "6c90ff5e1415136cb091028b060a2efcbae43e8cfb99446ee5aea4160837f2f5";
const prisma = new PrismaClient();

async function main() {
  const result = await runInstrumentGovernanceTransaction(prisma, async tx => {
    const instrument = await tx.institutionalInstrument.findUnique({
      where: { reference: globalMotherV2Definition.reference },
      select: {
        currentVersion: true,
        versions: { where: { number: 2 }, select: {
          id: true, status: true, issuedAt: true,
          propositions: { orderBy: { ordinal: "asc" }, select: {
            reference: true, title: true, body: true,
            responses: { select: { id: true } },
          } },
        } },
      },
    });
    const draft = instrument?.versions[0];
    const fingerprint = draft ? createHash("sha256")
      .update(JSON.stringify(draft.propositions.map((item: {
        reference: string; title: string; body: string;
      }) => [item.reference, item.title, item.body])))
      .digest("hex") : "";
    if (!instrument || instrument.currentVersion !== 1 || !draft ||
        draft.status !== "DRAFT" || draft.issuedAt !== null ||
        draft.propositions.length !== 7 || fingerprint !== previousDraftHash ||
        draft.propositions.some((item: { responses: readonly { id: string }[] }) => item.responses.length > 0)) {
      throw new Error("GM_V2_PRINCIPLE_REFRESH_PRECONDITION_FAILED");
    }
    const replaced = await replaceInstrumentDraftPropositionsWithClient({
      client: tx,
      instrumentReference: globalMotherV2Definition.reference,
      versionNumber: 2,
      propositions: globalMotherV2Definition.propositions,
    });
    if (replaced.version.id !== draft.id || replaced.currentVersion !== 1 ||
        JSON.stringify(replaced.version.propositions.map((item: { reference: string; body: string }) => [item.reference, item.body])) !==
          JSON.stringify(globalMotherV2Definition.propositions.map(item => [item.reference, item.body]))) {
      throw new Error("GM_V2_PRINCIPLE_REFRESH_POSTCONDITION_FAILED");
    }
    return { versionId: draft.id, count: replaced.version.propositions.length };
  });
  console.log("GM_V2_PRINCIPLES_REFRESHED", result);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
