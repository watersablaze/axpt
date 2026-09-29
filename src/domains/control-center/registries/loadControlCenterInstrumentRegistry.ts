import "server-only";

import { DSI_REFERENCE } from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { prisma } from "@/infrastructure/db/prisma";

export type ControlCenterInstrumentRegistryEntry = {
  reference: string;
  kind: string;
  title: string;
  status: string;
  currentVersion: number;
  updatedAt: Date;
  settlementStatus: string | null;
  counterpartyName: string | null;
  operatorHref: string | null;
};

type ControlCenterInstrumentRegistryRow = {
  reference: string;
  kind: string;
  title: string;
  status: string;
  currentVersion: number;
  updatedAt: Date;
  digitalSettlementInstruction: {
    settlementStatus: string;
    counterpartyName: string;
  } | null;
};

export async function loadControlCenterInstrumentRegistry(): Promise<
  readonly ControlCenterInstrumentRegistryEntry[]
> {
  const instruments = await prisma.institutionalInstrument.findMany({
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        reference: "asc",
      },
    ],
    select: {
      reference: true,
      kind: true,
      title: true,
      status: true,
      currentVersion: true,
      updatedAt: true,
      digitalSettlementInstruction: {
        select: {
          settlementStatus: true,
          counterpartyName: true,
        },
      },
    },
  });

  return instruments.map(
    (instrument: ControlCenterInstrumentRegistryRow) => ({
    reference: instrument.reference,
    kind: instrument.kind,
    title: instrument.title,
    status: instrument.status,
    currentVersion: instrument.currentVersion,
    updatedAt: instrument.updatedAt,
    settlementStatus:
      instrument.digitalSettlementInstruction?.settlementStatus ?? null,
    counterpartyName:
      instrument.digitalSettlementInstruction?.counterpartyName ?? null,
      operatorHref:
        instrument.reference === DSI_REFERENCE &&
        instrument.digitalSettlementInstruction
          ? `/admin/control-center/instruments/digital-settlement/${encodeURIComponent(
              instrument.reference,
            )}`
          : null,
    }),
  );
}
