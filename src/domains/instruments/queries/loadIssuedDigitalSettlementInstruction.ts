import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import {
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_VERSION_STATUS,
} from "../contracts";
import { resolveAuthorizedSettlementIngress } from "../digital-settlement/resolveAuthorizedSettlementIngress";

export async function loadIssuedDigitalSettlementInstruction(publicId: string) {
  const settlement = await prisma.digitalSettlementInstruction.findUnique({
    where: { publicId },
    include: {
      instrument: {
        include: {
          versions: true,
        },
      },
    },
  });

  if (
    !settlement ||
    !settlement.receivingAddress ||
    !settlement.receivingWalletId ||
    !settlement.receivingWalletRole
  ) {
    return null;
  }

  let registeredWallet;

  try {
    registeredWallet = resolveAuthorizedSettlementIngress(
      settlement.receivingAddress,
    );
  } catch {
    return null;
  }

  if (
    registeredWallet.id !== settlement.receivingWalletId ||
    registeredWallet.role !== settlement.receivingWalletRole
  ) {
    return null;
  }

  const version = settlement.instrument.versions.find(
    (candidate: { number: number; status: string; issuedAt: Date | null }) =>
      candidate.number === settlement.instrument.currentVersion,
  );

  if (
    settlement.instrument.status !== INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED ||
    version?.status !== INSTRUMENT_VERSION_STATUS.ISSUED ||
    !version.issuedAt
  ) {
    return null;
  }

  return {
    publicId: settlement.publicId,
    reference: settlement.instrument.reference,
    title: settlement.instrument.title,
    versionNumber: version.number,
    issuedAt: version.issuedAt,
    counterpartyName: settlement.counterpartyName,
    transactionDescription: settlement.transactionDescription,
    settlementPurpose: settlement.settlementPurpose,
    quantityKg: settlement.quantityKg.toString(),
    pricePerKgUsd: settlement.pricePerKgUsd.toString(),
    transactionValueUsd: settlement.transactionValueUsd.toString(),
    settlementPercentage: settlement.settlementPercentage.toString(),
    settlementAmountUsd: settlement.settlementAmountUsd.toString(),
    settlementAsset: settlement.settlementAsset,
    settlementNetwork: settlement.settlementNetwork,
    receivingEntity: settlement.receivingEntity,
    receivingAddress: settlement.receivingAddress,
    receivingWalletId: settlement.receivingWalletId,
    receivingWalletRole: settlement.receivingWalletRole,
    verificationAmountUsdt: settlement.verificationAmountUsdt.toString(),
    verificationTxHash: settlement.verificationTxHash,
    verificationConfirmedAt: settlement.verificationConfirmedAt,
    principalAuthorizedAt: settlement.principalAuthorizedAt,
    settlementStatus: settlement.settlementStatus,
  } as const;
}
