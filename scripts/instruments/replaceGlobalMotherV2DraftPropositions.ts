import {
  PrismaClient,
} from "@prisma/client";

import type {
  InstrumentGovernanceTransactionClient,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

import {
  replaceInstrumentDraftPropositionsWithClient,
} from "../../src/domains/instruments/commands/replaceInstrumentDraftPropositionsWithClient";

import {
  globalMotherV2Definition,
} from "../../src/domains/instruments/definitions/globalMotherV2Definition";

const prisma =
  new PrismaClient();

const EXPECTED_INSTRUMENT_ID =
  "cmty77xg90001w05ag9cqfhk1";

const EXPECTED_V1_ID =
  "cmty77xg90003w05afxgn6w4k";

const EXPECTED_V2_ID =
  "cmu8xeoht0001w0x02ma7zyqo";

const EXPECTED_REFERENCES = [
  "REL-01",
  "REL-02",
  "AUTH-01",
  "AUTH-02",
  "AUTH-03",
  "PASS-01",
  "PASS-02",
  "CONT-01",
  "CONT-02",
  "CONT-03",
  "INST-01",
  "INST-02",
] as const;

type MutationResponseRow = Readonly<{
  id: string;
}>;

type MutationPropositionRow = Readonly<{
  id?: string;
  reference: string;
  state?: string;
  ordinal?: number;
  responses: readonly MutationResponseRow[];
}>;

type MutationVersionRow = Readonly<{
  id: string;
  number: number;
  status: string;
  issuedAt: Date | null;
  supersededAt: Date | null;
  propositions: readonly MutationPropositionRow[];
}>;

type MutationPostPropositionRow = Readonly<{
  reference: string;
  state: string;
  ordinal: number;
  responses: readonly MutationResponseRow[];
}>;

type MutationPostVersionRow = Readonly<{
  id: string;
  number: number;
  status: string;
  issuedAt: Date | null;
  supersededAt: Date | null;
  propositions: readonly MutationPostPropositionRow[];
}>;

async function main() {
  const result =
    await prisma.$transaction(
      async (
        tx:
          InstrumentGovernanceTransactionClient,
      ) => {
        /*
         * PRE-MUTATION LOCK:
         * establish the exact canonical target
         * before any destructive replacement.
         */
        const before =
          await tx
            .institutionalInstrument
            .findUnique({
              where: {
                reference:
                  globalMotherV2Definition.reference,
              },

              select: {
                id:
                  true,

                status:
                  true,

                currentVersion:
                  true,

                versions: {
                  orderBy: {
                    number:
                      "asc",
                  },

                  select: {
                    id:
                      true,

                    number:
                      true,

                    status:
                      true,

                    issuedAt:
                      true,

                    supersededAt:
                      true,

                    propositions: {
                      select: {
                        id:
                          true,

                        reference:
                          true,

                        responses: {
                          select: {
                            id:
                              true,
                          },
                        },
                      },
                    },
                  },
                },

                _count: {
                  select: {
                    parties:
                      true,

                    accessGrants:
                      true,

                    authorities:
                      true,

                    stateTransitions:
                      true,

                    evidence:
                      true,
                  },
                },
              },
            });

        if (!before) {
          throw new Error(
            "GM_G2M_4B_1_INSTRUMENT_NOT_FOUND",
          );
        }

        const beforeV1 =
          before.versions.find(
            (
              version:
                MutationVersionRow,
            ) =>
              version.number === 1,
          );

        const beforeV2 =
          before.versions.find(
            (
              version:
                MutationVersionRow,
            ) =>
              version.number === 2,
          );

        const responseCount =
          (
            version:
              MutationVersionRow,
          ) =>
            version.propositions.reduce(
              (
                total:
                  number,
                proposition:
                  MutationPropositionRow,
              ) =>
                total +
                proposition.responses.length,
              0,
            );

        if (
          before.id !==
            EXPECTED_INSTRUMENT_ID ||
          before.status !==
            "UNDER_DELIBERATION" ||
          before.currentVersion !==
            1
        ) {
          throw new Error(
            "GM_G2M_4B_1_INSTRUMENT_BOUNDARY_MISMATCH",
          );
        }

        if (
          !beforeV1 ||
          beforeV1.id !==
            EXPECTED_V1_ID ||
          beforeV1.status !==
            "ISSUED" ||
          beforeV1.propositions.length !==
            8 ||
          responseCount(beforeV1) !==
            0 ||
          beforeV1.supersededAt !==
            null
        ) {
          throw new Error(
            "GM_G2M_4B_1_V1_PRECONDITION_FAILED",
          );
        }

        if (
          !beforeV2 ||
          beforeV2.id !==
            EXPECTED_V2_ID ||
          beforeV2.status !==
            "DRAFT" ||
          beforeV2.propositions.length !==
            8 ||
          responseCount(beforeV2) !==
            0 ||
          beforeV2.issuedAt !==
            null ||
          beforeV2.supersededAt !==
            null
        ) {
          throw new Error(
            "GM_G2M_4B_1_V2_PRECONDITION_FAILED",
          );
        }

        if (
          before._count.parties !==
            2 ||
          before._count.accessGrants !==
            1 ||
          before._count.authorities !==
            0 ||
          before._count.stateTransitions !==
            0 ||
          before._count.evidence !==
            0
        ) {
          throw new Error(
            "GM_G2M_4B_1_GOVERNANCE_PRECONDITION_FAILED",
          );
        }

        console.log(
          "GM_G2M_4B_1_PRECONDITIONS_CONFIRMED",
        );

        /*
         * CANONICAL REPLACEMENT:
         * V2 propositions only.
         */
        const replaced =
          await replaceInstrumentDraftPropositionsWithClient({
            client:
              tx,

            instrumentReference:
              globalMotherV2Definition.reference,

            versionNumber:
              globalMotherV2Definition.version,

            propositions:
              globalMotherV2Definition.propositions,
          });

        if (
          replaced.instrumentId !==
            EXPECTED_INSTRUMENT_ID ||
          replaced.currentVersion !==
            1 ||
          replaced.version.id !==
            EXPECTED_V2_ID ||
          replaced.version.number !==
            2 ||
          replaced.version.status !==
            "DRAFT" ||
          replaced.version.propositions.length !==
            12
        ) {
          throw new Error(
            "GM_G2M_4B_1_REPLACEMENT_RESULT_INVALID",
          );
        }

        const actualReferences =
          replaced.version.propositions.map(
            (
              proposition:
                Readonly<{
                  reference: string;
                }>,
            ) =>
              proposition.reference,
          );

        if (
          JSON.stringify(
            actualReferences,
          ) !==
          JSON.stringify(
            EXPECTED_REFERENCES,
          )
        ) {
          throw new Error(
            "GM_G2M_4B_1_REFERENCE_ORDER_MISMATCH",
          );
        }

        /*
         * POST-MUTATION GOVERNANCE PROOF
         * inside the same transaction.
         */
        const after =
          await tx
            .institutionalInstrument
            .findUnique({
              where: {
                id:
                  EXPECTED_INSTRUMENT_ID,
              },

              select: {
                status:
                  true,

                currentVersion:
                  true,

                versions: {
                  orderBy: {
                    number:
                      "asc",
                  },

                  select: {
                    id:
                      true,

                    number:
                      true,

                    status:
                      true,

                    issuedAt:
                      true,

                    supersededAt:
                      true,

                    propositions: {
                      orderBy: {
                        ordinal:
                          "asc",
                      },

                      select: {
                        reference:
                          true,

                        state:
                          true,

                        ordinal:
                          true,

                        responses: {
                          select: {
                            id:
                              true,
                          },
                        },
                      },
                    },
                  },
                },

                _count: {
                  select: {
                    parties:
                      true,

                    accessGrants:
                      true,

                    authorities:
                      true,

                    stateTransitions:
                      true,

                    evidence:
                      true,
                  },
                },
              },
            });

        if (!after) {
          throw new Error(
            "GM_G2M_4B_1_POST_MUTATION_INSTRUMENT_MISSING",
          );
        }

        const afterV1 =
          after.versions.find(
            (
              version:
                MutationPostVersionRow,
            ) =>
              version.number === 1,
          );

        const afterV2 =
          after.versions.find(
            (
              version:
                MutationPostVersionRow,
            ) =>
              version.number === 2,
          );

        if (
          after.status !==
            "UNDER_DELIBERATION" ||
          after.currentVersion !==
            1
        ) {
          throw new Error(
            "GM_G2M_4B_1_INSTRUMENT_STATE_CHANGED",
          );
        }

        if (
          !afterV1 ||
          afterV1.id !==
            EXPECTED_V1_ID ||
          afterV1.status !==
            "ISSUED" ||
          afterV1.propositions.length !==
            8 ||
          afterV1.supersededAt !==
            null ||
          afterV1.propositions.some(
            (
              proposition:
                MutationPostPropositionRow,
            ) =>
              proposition.responses.length !==
                0,
          )
        ) {
          throw new Error(
            "GM_G2M_4B_1_V1_BOUNDARY_BROKEN",
          );
        }

        if (
          !afterV2 ||
          afterV2.id !==
            EXPECTED_V2_ID ||
          afterV2.status !==
            "DRAFT" ||
          afterV2.issuedAt !==
            null ||
          afterV2.supersededAt !==
            null ||
          afterV2.propositions.length !==
            12 ||
          afterV2.propositions.some(
            (
              proposition:
                MutationPostPropositionRow,
            ) =>
              proposition.responses.length !==
                0,
          )
        ) {
          throw new Error(
            "GM_G2M_4B_1_V2_POSTCONDITION_FAILED",
          );
        }

        const postReferences =
          afterV2.propositions.map(
            (
              proposition:
                MutationPostPropositionRow,
            ) =>
              proposition.reference,
          );

        if (
          JSON.stringify(
            postReferences,
          ) !==
          JSON.stringify(
            EXPECTED_REFERENCES,
          )
        ) {
          throw new Error(
            "GM_G2M_4B_1_POST_REFERENCE_MISMATCH",
          );
        }

        const postOrdinals =
          afterV2.propositions.map(
            (
              proposition:
                MutationPostPropositionRow,
            ) =>
              proposition.ordinal,
          );

        if (
          JSON.stringify(
            postOrdinals,
          ) !==
          JSON.stringify(
            Array.from(
              {
                length:
                  12,
              },
              (_, index) =>
                index + 1,
            ),
          )
        ) {
          throw new Error(
            "GM_G2M_4B_1_POST_ORDINAL_MISMATCH",
          );
        }

        if (
          after._count.parties !==
            2 ||
          after._count.accessGrants !==
            1 ||
          after._count.authorities !==
            0 ||
          after._count.stateTransitions !==
            0 ||
          after._count.evidence !==
            0
        ) {
          throw new Error(
            "GM_G2M_4B_1_GOVERNANCE_BOUNDARY_BROKEN",
          );
        }

        console.log(
          "GM_G2M_4B_1_V2_REPLACED_8_TO_12",
        );

        console.log(
          "GM_G2M_4B_1_V1_UNTOUCHED",
        );

        console.log(
          "GM_G2M_4B_1_CURRENT_VERSION_PRESERVED",
        );

        console.log(
          "GM_G2M_4B_1_NO_AUTHORITY_OR_EXECUTION_SIDE_EFFECTS",
        );

        return {
          currentVersion:
            after.currentVersion,

          v1Propositions:
            afterV1.propositions.length,

          v2Propositions:
            afterV2.propositions.length,

          references:
            postReferences,
        };
      },
    );

  console.log(
    JSON.stringify(
      {
        committed:
          true,

        ...result,
      },
      null,
      2,
    ),
  );

  console.log(
    "GM_G2M_4B_1_TRANSACTION_COMMITTED",
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
