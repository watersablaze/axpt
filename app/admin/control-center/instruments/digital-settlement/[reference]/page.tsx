import { notFound } from "next/navigation";

import DigitalSettlementOperatorPanel from "@/components/admin/instruments/DigitalSettlementOperatorPanel";
import { prisma } from "@/infrastructure/db/prisma";

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

  const instrument = await prisma.institutionalInstrument.findUnique({
    where: {
      reference,
    },
    include: {
      digitalSettlementInstruction: true,
    },
  });

  const settlement = instrument?.digitalSettlementInstruction;

  if (!instrument || !settlement) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <DigitalSettlementOperatorPanel
        reference={instrument.reference}
        counterpartyName={settlement.counterpartyName}
        counterpartyRepresentative={
          settlement.counterpartyRepresentative
        }
        settlementStatus={settlement.settlementStatus}
        pricingStatus={settlement.pricingStatus}
        verificationAmountUsdt={
          settlement.verificationAmountUsdt.toString()
        }
        verificationTxHash={settlement.verificationTxHash}
        verificationConfirmedAt={
          settlement.verificationConfirmedAt?.toISOString() ?? null
        }
        principalAuthorizedAt={
          settlement.principalAuthorizedAt?.toISOString() ?? null
        }
        receivingAddress={settlement.receivingAddress}
        settlementAmountUsd={
          settlement.settlementAmountUsd?.toString() ?? null
        }
      />
    </div>
  );
}
