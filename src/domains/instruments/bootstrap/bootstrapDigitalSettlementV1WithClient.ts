import type { PrismaClient } from "@prisma/client";

import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { createDigitalSettlementV1Definition } from "../definitions/digitalSettlementV1Definition";
import { assertDigitalSettlementCommercialSnapshot } from "../invariants/digitalSettlementCommercialSnapshot";

export type DigitalSettlementBootstrapClient = Pick<
  PrismaClient,
  "institutionalInstrument" | "domainEvent"
>;

export type DigitalSettlementBootstrapResult = Readonly<{
  instrumentId: string;
  versionId: string;
  settlementInstructionId: string;
  publicId: string;
  created: boolean;
}>;

export async function bootstrapDigitalSettlementV1WithClient(params: {
  client: DigitalSettlementBootstrapClient;
  actorUserId: string;
  counterpartyLegalName: string;
}): Promise<DigitalSettlementBootstrapResult> {
  const { client, actorUserId } = params;
  const definition = createDigitalSettlementV1Definition(
    params.counterpartyLegalName,
  );

  assertDigitalSettlementCommercialSnapshot(definition.settlement);

  const existing = await client.institutionalInstrument.findUnique({
    where: { reference: definition.instrument.reference },
    include: {
      versions: {
        where: { number: definition.version.number },
      },
      digitalSettlementInstruction: true,
    },
  });

  if (existing) {
    const version = existing.versions[0];
    const settlement = existing.digitalSettlementInstruction;

    if (!version || !settlement) {
      throw new Error(
        `[DSI_V1_BOOTSTRAP_INCOMPLETE] instrument=${existing.id}`,
      );
    }

    if (settlement.publicId !== definition.settlement.publicId) {
      throw new Error(
        `[DSI_V1_BOOTSTRAP_PUBLIC_ID_MISMATCH] expected=${definition.settlement.publicId} actual=${settlement.publicId}`,
      );
    }

    if (
      settlement.counterpartyName !== definition.settlement.counterpartyName
    ) {
      throw new Error(
        `[DSI_V1_BOOTSTRAP_COUNTERPARTY_MISMATCH] expected=${definition.settlement.counterpartyName} actual=${settlement.counterpartyName}`,
      );
    }

    if (
      settlement.settlementPurpose !== definition.settlement.settlementPurpose
    ) {
      throw new Error(
        `[DSI_V1_BOOTSTRAP_PURPOSE_MISMATCH] expected=${definition.settlement.settlementPurpose} actual=${settlement.settlementPurpose}`,
      );
    }

    return {
      instrumentId: existing.id,
      versionId: version.id,
      settlementInstructionId: settlement.id,
      publicId: settlement.publicId,
      created: false,
    };
  }

  const now = new Date();
  const instrument = await client.institutionalInstrument.create({
    data: {
      ...definition.instrument,
      createdByUserId: actorUserId,
      versions: {
        create: {
          ...definition.version,
          createdByUserId: actorUserId,
        },
      },
      parties: {
        create: definition.parties.map((party) => ({ ...party })),
      },
      digitalSettlementInstruction: {
        create: { ...definition.settlement },
      },
    },
    include: {
      versions: {
        where: { number: definition.version.number },
      },
      digitalSettlementInstruction: true,
    },
  });

  const version = instrument.versions[0];
  const settlement = instrument.digitalSettlementInstruction;

  if (!version || !settlement) {
    throw new Error(
      `[DSI_V1_BOOTSTRAP_CREATED_RECORD_MISSING] instrument=${instrument.id}`,
    );
  }

  await client.domainEvent.createMany({
    data: [
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_CREATED,
        payload: {
          reference: instrument.reference,
          kind: instrument.kind,
          title: instrument.title,
        },
        metadata: {
          actorUserId,
          source: "instrument.bootstrap.digital-settlement",
        },
        occurredAt: now,
      },
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_CREATED,
        payload: {
          versionId: version.id,
          versionNumber: version.number,
        },
        metadata: {
          actorUserId,
          source: "instrument.bootstrap.digital-settlement",
        },
        occurredAt: now,
      },
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.SETTLEMENT_INSTRUCTION_DEFINED,
        payload: {
          settlementInstructionId: settlement.id,
          publicId: settlement.publicId,
          pricingStatus: settlement.pricingStatus,
          pricingBasis: settlement.pricingBasis,
          transactionValueUsd:
            settlement.transactionValueUsd?.toString() ?? null,
          settlementAmountUsd:
            settlement.settlementAmountUsd?.toString() ?? null,
          settlementAsset: settlement.settlementAsset,
          settlementNetwork: settlement.settlementNetwork,
        },
        metadata: {
          actorUserId,
          source: "instrument.bootstrap.digital-settlement",
        },
        occurredAt: now,
      },
    ],
  });

  return {
    instrumentId: instrument.id,
    versionId: version.id,
    settlementInstructionId: settlement.id,
    publicId: settlement.publicId,
    created: true,
  };
}
