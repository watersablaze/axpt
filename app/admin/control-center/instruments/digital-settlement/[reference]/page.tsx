import { notFound } from "next/navigation";
import Link from "next/link";

import DigitalSettlementOperatorPanel from "@/components/admin/instruments/DigitalSettlementOperatorPanel";
import {
  createDigitalSettlementV1Definition,
  DSI_APPROVED_ISSUANCE_PRICING,
  DSI_REFERENCE,
  INDERAKSH_LEGAL_NAME,
  INDERAKSH_REPRESENTATIVE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { DSI_V2_FINANCIER_REVISION } from "@/domains/instruments/definitions/digitalSettlementV2FinancierRevision";
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
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <section className="rounded-xl border border-amber-900/70 bg-amber-950/10 p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-amber-400">
          V2 Financier Revision / Preview Only
        </div>
        <h2 className="mt-2 text-base font-medium text-white">
          Buyer-informed participant correction
        </h2>
        <p className="mt-2 max-w-4xl text-xs leading-5 text-neutral-400">
          {DSI_V2_FINANCIER_REVISION.revisionBasis} V1 remains the preserved
          issued record. This branch exposes no control to supersede V1, create
          access grants, or send V2 communications.
        </p>

        <div className="mt-4 grid gap-3 text-xs md:grid-cols-3">
          <div className="rounded border border-neutral-800 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Active Participant
            </div>
            <div className="mt-1 text-white">
              {DSI_V2_FINANCIER_REVISION.tapFinancier.name}
            </div>
            <div className="mt-1 text-amber-300">Appointed TAP Financier</div>
          </div>
          <div className="rounded border border-neutral-800 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Buyer Review
            </div>
            <div className="mt-1 text-white">
              {DSI_V2_FINANCIER_REVISION.buyerRepresentative.name}
            </div>
            <div className="mt-1 text-cyan-300">
              Authorized Buyer Representative
            </div>
          </div>
          <div className="rounded border border-neutral-800 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              External Review
            </div>
            <div className="mt-1 text-white">
              {DSI_V2_FINANCIER_REVISION.externalReviewer.name}
            </div>
            <div className="mt-1 text-cyan-300">Seller Consultant</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/control-center/instruments/digital-settlement/${DSI_REFERENCE}/email-preview?version=2`}
            className="rounded border border-amber-800 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 hover:border-amber-600"
          >
            Review Five V2 Emails
          </Link>
          <Link
            href="/french-ward/instruments/__preview__?previewMode=buyer&version=2"
            className="rounded border border-cyan-900 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-600"
          >
            Review V2 Instrument
          </Link>
        </div>
      </section>

      <DigitalSettlementOperatorPanel
        instantiated={Boolean(instrument && settlement)}
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
