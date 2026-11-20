import { PrismaClient } from "@prisma/client";
import { globalMotherV2Definition } from "../../src/domains/instruments/definitions/globalMotherV2Definition";
import { replaceInstrumentDraftPropositionsWithClient } from "../../src/domains/instruments/commands/replaceInstrumentDraftPropositionsWithClient";
import { runInstrumentGovernanceTransaction } from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma = new PrismaClient();
const oldReferences = [
  "REL-01", "REL-02", "AUTH-01", "AUTH-02",
  "PASS-01", "PASS-02", "FUT-01", "FUT-02",
];

async function main() {
  const result = await runInstrumentGovernanceTransaction(prisma, async tx => {
    const instrument = await tx.institutionalInstrument.findUnique({
      where: { reference: globalMotherV2Definition.reference },
      select: {
        id: true, currentVersion: true,
        versions: {
          where: { number: globalMotherV2Definition.version },
          select: {
            id: true, status: true, issuedAt: true,
            propositions: {
              orderBy: { ordinal: "asc" },
              select: { reference: true, responses: { select: { id: true } } },
            },
          },
        },
      },
    });
    const draft = instrument?.versions[0];
    if (!instrument || instrument.currentVersion !== 1 || !draft ||
        draft.status !== "DRAFT" || draft.issuedAt !== null ||
        draft.propositions.some((proposition: { responses: readonly { id: string }[] }) => proposition.responses.length > 0) ||
        JSON.stringify(draft.propositions.map((proposition: { reference: string }) => proposition.reference)) !==
          JSON.stringify(oldReferences)) {
      throw new Error("GM_V2_SEVEN_DRAFT_PRECONDITION_FAILED");
    }
    const replaced = await replaceInstrumentDraftPropositionsWithClient({
      client: tx,
      instrumentReference: globalMotherV2Definition.reference,
      versionNumber: globalMotherV2Definition.version,
      propositions: globalMotherV2Definition.propositions,
    });
    if (replaced.version.id !== draft.id || replaced.currentVersion !== 1 ||
        JSON.stringify(replaced.version.propositions.map((proposition: { reference: string }) => proposition.reference)) !==
          JSON.stringify(globalMotherV2Definition.propositions.map(proposition => proposition.reference))) {
      throw new Error("GM_V2_SEVEN_DRAFT_POSTCONDITION_FAILED");
    }
    return { versionId: draft.id, count: replaced.version.propositions.length };
  }, { timeoutMs: 60_000 });
  console.log("GM_V2_SEVEN_DRAFT_REPLACED", result);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
