import { notFound } from "next/navigation";

import DigitalSettlementOperatorPanel from "@/components/admin/instruments/DigitalSettlementOperatorPanel";
import {
  createDigitalSettlementV1Definition,
  DSI_REFERENCE,
  INDERAKSH_LEGAL_NAME,
  INDERAKSH_REPRESENTATIVE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
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

  const instrument =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference,
      },
      include: {
        digitalSettlementInstruction: true,
      },
    });

  const settlement =
    instrument?.digitalSettlementInstruction ?? null;

  const operationsWallet = TREASURY_WALLETS.find(
    (wallet) => wallet.role === "operations",
  );

  if (!operationsWallet) {
    throw new Error(
      "[DSI_OPERATOR_SURFACE_OPERATIONS_WALLET_NOT_CONFIGURED]",
    );
  }

  const definition =
    createDigitalSettlementV1Definition(
      INDERAKSH_LEGAL_NAME,
    );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <DigitalSettlementOperatorPanel
        instantiated={Boolean(instrument && settlement)}
        reference={DSI_REFERENCE}
        counterpartyName={
          settlement?.counterpartyName ??
          INDERAKSH_LEGAL_NAME
        }
        counterpartyRepresentative={
          settlement?.counterpartyRepresentative ??
          INDERAKSH_REPRESENTATIVE
        }
        settlementStatus={
          settlement?.settlementStatus ??
          definition.settlement.settlementStatus
        }
        pricingStatus={
          settlement?.pricingStatus ??
          definition.settlement.pricingStatus
        }
        verificationAmountUsdt={
          settlement?.verificationAmountUsdt.toString() ??
          definition.settlement.verificationAmountUsdt
        }
        verificationTxHash={
          settlement?.verificationTxHash ?? null
        }
        verificationConfirmedAt={
          settlement?.verificationConfirmedAt?.toISOString() ??
          null
        }
        principalAuthorizedAt={
          settlement?.principalAuthorizedAt?.toISOString() ??
          null
        }
        receivingAddress={
          settlement?.receivingAddress ?? null
        }
        settlementAmountUsd={
          settlement?.settlementAmountUsd?.toString() ??
          null
        }
        authorizedOperationsAddress={
          operationsWallet.address
        }
        authorizedOperationsName={
          operationsWallet.name
        }
      />
    </div>
  );
}
