import { notFound } from "next/navigation";
import DigitalSettlementOperatorPanel from "@/components/admin/instruments/DigitalSettlementOperatorPanel";
import {
  createDigitalSettlementV1Definition,
  DSI_APPROVED_ISSUANCE_PRICING,
  DSI_REFERENCE,
  INDERAKSH_LEGAL_NAME,
  INDERAKSH_REPRESENTATIVE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import {
  findDigitalSettlementVerificationCandidateWithClient,
  type DigitalSettlementVerificationMatchingClient,
} from "@/domains/instruments/verification-matching";
import { prisma } from "@/infrastructure/db/prisma";
import { TREASURY_WALLETS } from "@/lib/treasury/config";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    reference: string;
  }>;
};

export default async function DigitalSettlementOperatorPage({
  params,
}: PageProps) {
  const { reference } = await params;

  if (reference !== DSI_REFERENCE) {
    notFound();
  }

  const instrument = await prisma.institutionalInstrument.findUnique({
    where: {
      reference,
    },
    include: {
      digitalSettlementInstruction: true,
    },
  });

  const settlement = instrument?.digitalSettlementInstruction ?? null;

  const operationsWallet = TREASURY_WALLETS.find(
    (wallet) => wallet.role === "operations",
  );

  if (!operationsWallet) {
    throw new Error("[DSI_OPERATOR_SURFACE_OPERATIONS_WALLET_NOT_CONFIGURED]");
  }

  const definition = createDigitalSettlementV1Definition(INDERAKSH_LEGAL_NAME);

  /*
   * The operator surface may display chain evidence, but it does not
   * become an authority boundary.
   *
   * The confirmation route re-runs this matcher inside its transaction
   * immediately before the canonical recognition command.
   */
  const verificationMatch =
    instrument &&
    settlement?.settlementStatus === "AWAITING_VERIFICATION_TRANSFER"
      ? await findDigitalSettlementVerificationCandidateWithClient({
          client: prisma as DigitalSettlementVerificationMatchingClient,

          instrumentReference: reference,
        })
      : null;

  const verificationEvidence =
    verificationMatch === null
      ? null
      : {
          disposition: verificationMatch.disposition,

          amountUsdt: verificationMatch.expectation.amountUsdt,

          receivingAddress: verificationMatch.expectation.receivingAddress,

          network: "Ethereum Mainnet" as const,

          candidate:
            verificationMatch.disposition === "MATCHED" ||
            verificationMatch.disposition === "AMBIGUOUS_INSTRUCTIONS"
              ? {
                  transactionHash: verificationMatch.candidate.txHash,

                  blockNumber:
                    verificationMatch.candidate.blockNumber.toString(),

                  chainTimestamp:
                    verificationMatch.candidate.chainTimestamp.toISOString(),

                  senderAddress: verificationMatch.candidate.fromAddress,

                  confirmationCount:
                    verificationMatch.candidate.confirmationCount,

                  requiredConfirmations:
                    verificationMatch.candidate.requiredConfirmations,
                }
              : null,

          candidateCount:
            verificationMatch.disposition === "AMBIGUOUS_OBSERVATIONS"
              ? verificationMatch.candidates.length
              : null,

          conflictingInstrumentReferences:
            verificationMatch.disposition === "AMBIGUOUS_INSTRUCTIONS"
              ? [...verificationMatch.conflictingInstrumentReferences]
              : [],
        };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-10 sm:space-y-5 sm:px-6 sm:pb-12 lg:px-8">
      <DigitalSettlementOperatorPanel
        instantiated={Boolean(instrument && settlement)}
        currentVersion={instrument?.currentVersion ?? 0}
        reference={DSI_REFERENCE}
        counterpartyName={settlement?.counterpartyName ?? INDERAKSH_LEGAL_NAME}
        counterpartyRepresentative={
          settlement?.counterpartyRepresentative ?? INDERAKSH_REPRESENTATIVE
        }
        settlementStatus={
          settlement?.settlementStatus ?? definition.settlement.settlementStatus
        }
        pricingStatus={
          settlement?.pricingStatus ?? definition.settlement.pricingStatus
        }
        verificationAmountUsdt={
          settlement?.verificationAmountUsdt.toString() ??
          definition.settlement.verificationAmountUsdt
        }
        verificationTxHash={settlement?.verificationTxHash ?? null}
        verificationConfirmedAt={
          settlement?.verificationConfirmedAt?.toISOString() ?? null
        }
        principalAuthorizedAt={
          settlement?.principalAuthorizedAt?.toISOString() ?? null
        }
        receivingAddress={settlement?.receivingAddress ?? null}
        settlementAmountUsd={
          settlement?.settlementAmountUsd?.toString() ?? null
        }
        authorizedOperationsAddress={operationsWallet.address}
        authorizedOperationsName={operationsWallet.name}
        defaultSpotBenchmark={DSI_APPROVED_ISSUANCE_PRICING.spotBenchmark}
        defaultSpotPricePerKgUsd={
          DSI_APPROVED_ISSUANCE_PRICING.spotPricePerKgUsd
        }
        verificationEvidence={verificationEvidence}
      />
    </div>
  );
}
