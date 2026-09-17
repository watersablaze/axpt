import type { PrismaClient } from "@prisma/client";
import { getAddress, isAddress } from "viem";

import {
  DIGITAL_SETTLEMENT_STATUS,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_VERSION_STATUS,
} from "../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type DigitalSettlementIssuanceClient = Pick<
  PrismaClient,
  | "institutionalInstrument"
  | "instrumentVersion"
  | "digitalSettlementInstruction"
  | "domainEvent"
>;

export async function issueDigitalSettlementInstructionWithClient(params: {
  client: DigitalSettlementIssuanceClient;
  instrumentReference: string;
  receivingAddress: string;
  actorUserId: string;
}) {
  const receivingAddress = params.receivingAddress.trim();

  if (!isAddress(receivingAddress)) {
    throw new Error("[DSI_ISSUANCE_INVALID_ETHEREUM_ADDRESS]");
  }

  const checksumAddress = getAddress(receivingAddress);
  const instrument = await params.client.institutionalInstrument.findUnique({
    where: { reference: params.instrumentReference },
    include: {
      versions: true,
      digitalSettlementInstruction: true,
    },
  });

  if (!instrument || !instrument.digitalSettlementInstruction) {
    throw new Error(
      `[DSI_ISSUANCE_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  const version = instrument.versions.find(
    (candidate: {
      id: string;
      number: number;
      status: string;
    }) => candidate.number === instrument.currentVersion,
  );

  if (!version) {
    throw new Error(
      `[DSI_ISSUANCE_VERSION_MISSING] ${instrument.currentVersion}`,
    );
  }

  if (instrument.status === INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED) {
    if (
      instrument.digitalSettlementInstruction.receivingAddress !==
      checksumAddress
    ) {
      throw new Error("[DSI_ISSUANCE_ALREADY_ISSUED_ADDRESS_MISMATCH]");
    }

    return {
      instrumentId: instrument.id,
      versionId: version.id,
      publicId: instrument.digitalSettlementInstruction.publicId,
      receivingAddress: checksumAddress,
      issued: false,
    } as const;
  }

  if (
    instrument.status !== INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT ||
    version.status !== INSTRUMENT_VERSION_STATUS.DRAFT
  ) {
    throw new Error(
      `[DSI_ISSUANCE_INVALID_STATE] instrument=${instrument.status} version=${version.status}`,
    );
  }

  const now = new Date();

  await params.client.digitalSettlementInstruction.update({
    where: { id: instrument.digitalSettlementInstruction.id },
    data: {
      receivingAddress: checksumAddress,
      settlementStatus: DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER,
    },
  });

  await params.client.instrumentVersion.update({
    where: { id: version.id },
    data: {
      status: INSTRUMENT_VERSION_STATUS.ISSUED,
      issuedAt: now,
    },
  });

  await params.client.institutionalInstrument.update({
    where: { id: instrument.id },
    data: { status: INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED },
  });

  await params.client.domainEvent.createMany({
    data: [
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_ISSUED,
        payload: {
          versionId: version.id,
          versionNumber: version.number,
          issuedAt: now.toISOString(),
        },
        metadata: {
          actorUserId: params.actorUserId,
          source: "instrument.command.issue-digital-settlement",
        },
        occurredAt: now,
      },
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.SETTLEMENT_INSTRUCTION_ISSUED,
        payload: {
          settlementInstructionId: instrument.digitalSettlementInstruction.id,
          publicId: instrument.digitalSettlementInstruction.publicId,
          receivingAddress: checksumAddress,
          settlementStatus: DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER,
        },
        metadata: {
          actorUserId: params.actorUserId,
          source: "instrument.command.issue-digital-settlement",
        },
        occurredAt: now,
      },
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_STATUS_CHANGED,
        payload: {
          from: instrument.status,
          to: INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED,
        },
        metadata: {
          actorUserId: params.actorUserId,
          source: "instrument.command.issue-digital-settlement",
        },
        occurredAt: now,
      },
    ],
  });

  return {
    instrumentId: instrument.id,
    versionId: version.id,
    publicId: instrument.digitalSettlementInstruction.publicId,
    receivingAddress: checksumAddress,
    issued: true,
  } as const;
}
