import type { PrismaClient } from "@prisma/client";
import { getAddress, isAddress, parseUnits } from "viem";

import { TOKENS } from "@/lib/treasury/config";
import {
  DIGITAL_SETTLEMENT_STATUS,
  INSTITUTIONAL_INSTRUMENT_STATUS,
} from "../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

const TRANSACTION_HASH = /^0x[0-9a-fA-F]{64}$/;

export type DigitalSettlementVerificationClient = Pick<
  PrismaClient,
  "institutionalInstrument" | "digitalSettlementInstruction" | "domainEvent"
>;

export async function confirmDigitalSettlementVerificationWithClient(params: {
  client: DigitalSettlementVerificationClient;
  instrumentReference: string;
  transactionHash: string;
  observedAmountUsdt: string;
  observedReceivingAddress: string;
  verificationObservationId: string;
  verificationInstrumentVersionId: string;
  actorUserId: string;
  verifiedAt?: Date;
}) {
  const transactionHash = params.transactionHash.trim().toLowerCase();

  if (!TRANSACTION_HASH.test(transactionHash)) {
    throw new Error("[DSI_VERIFICATION_INVALID_TRANSACTION_HASH]");
  }

  const observedReceivingAddress = params.observedReceivingAddress.trim();

  if (!isAddress(observedReceivingAddress)) {
    throw new Error("[DSI_VERIFICATION_INVALID_RECEIVING_ADDRESS]");
  }

  let observedAmount: bigint;

  try {
    observedAmount = parseUnits(
      params.observedAmountUsdt.trim(),
      TOKENS.USDT.decimals,
    );
  } catch {
    throw new Error("[DSI_VERIFICATION_INVALID_OBSERVED_AMOUNT]");
  }

  const instrument = await params.client.institutionalInstrument.findUnique({
    where: { reference: params.instrumentReference },
    include: {
      digitalSettlementInstruction: true,
      versions: true,
    },
  });

  const settlement = instrument?.digitalSettlementInstruction;

  if (!instrument || !settlement) {
    throw new Error(
      `[DSI_VERIFICATION_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  if (instrument.status !== INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED) {
    throw new Error(
      `[DSI_VERIFICATION_INSTRUMENT_NOT_ISSUED] ${instrument.status}`,
    );
  }

  const currentVersion = instrument.versions.find(
    (version: { id: string; number: number; status: string }) =>
      version.number === instrument.currentVersion,
  );

  if (
    !currentVersion ||
    currentVersion.status !== "ISSUED" ||
    currentVersion.id !== params.verificationInstrumentVersionId
  ) {
    throw new Error("[DSI_VERIFICATION_INSTRUMENT_VERSION_MISMATCH]");
  }

  if (
    !settlement.receivingAddress ||
    getAddress(observedReceivingAddress) !== settlement.receivingAddress
  ) {
    throw new Error("[DSI_VERIFICATION_RECEIVING_ADDRESS_MISMATCH]");
  }

  const expectedAmount = parseUnits(
    settlement.verificationAmountUsdt.toString(),
    TOKENS.USDT.decimals,
  );

  if (observedAmount !== expectedAmount) {
    throw new Error(
      `[DSI_VERIFICATION_AMOUNT_MISMATCH] expected=${settlement.verificationAmountUsdt.toString()} actual=${params.observedAmountUsdt.trim()}`,
    );
  }

  if (
    settlement.settlementStatus ===
      DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED &&
    settlement.verificationTxHash === transactionHash
  ) {
    return { confirmed: false, transactionHash } as const;
  }

  if (
    settlement.settlementStatus !==
    DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER
  ) {
    throw new Error(
      `[DSI_VERIFICATION_INVALID_STATE] ${settlement.settlementStatus}`,
    );
  }

  const verifiedAt = params.verifiedAt ?? new Date();
  const updated = await params.client.digitalSettlementInstruction.updateMany({
    where: {
      id: settlement.id,
      settlementStatus:
        DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER,
    },
    data: {
      verificationTxHash: transactionHash,
      verificationObservationId: params.verificationObservationId,
      verificationInstrumentVersionId: params.verificationInstrumentVersionId,
      verificationConfirmedAt: verifiedAt,
      settlementStatus: DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED,
    },
  });

  if (updated.count !== 1) {
    throw new Error("[DSI_VERIFICATION_CONCURRENT_TRANSITION]");
  }

  await params.client.domainEvent.create({
    data: {
      streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: instrument.id,
      eventType: INSTRUMENT_EVENT_TYPE.SETTLEMENT_VERIFICATION_RECOGNIZED,
      payload: {
        instrumentId: instrument.id,
        settlementInstructionId: settlement.id,
        instrumentVersionId: params.verificationInstrumentVersionId,
        observationId: params.verificationObservationId,
        transactionHash,
        verificationAmountUsdt: settlement.verificationAmountUsdt.toString(),
        observedAmountUsdt: params.observedAmountUsdt.trim(),
        observedReceivingAddress: getAddress(observedReceivingAddress),
        tokenContractAddress: TOKENS.USDT.address,
        chainId: 1,
        from: settlement.settlementStatus,
        to: DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED,
        recognizedAt: verifiedAt.toISOString(),
      },
      metadata: {
        actorUserId: params.actorUserId,
        source: "instrument.command.confirm-settlement-verification",
      },
      occurredAt: verifiedAt,
    },
  });

  return { confirmed: true, transactionHash, verifiedAt } as const;
}
