import "server-only";

import { DSI_REFERENCE } from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { GLOBAL_MOTHER_V2_INSTRUMENT_REFERENCE } from "@/domains/instruments/definitions/globalMotherV2Definition";
import { prisma } from "@/infrastructure/db/prisma";

export type ControlCenterInstrumentRegistryEntry = {
  reference: string;
  kind: string;
  title: string;
  status: string;
  currentVersion: number;
  updatedAt: Date;
  domainState: string | null;
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
  versions: { status: string }[];
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
      versions: {
        where: { number: 2 },
        select: { status: true },
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
    domainState:
      instrument.reference === GLOBAL_MOTHER_V2_INSTRUMENT_REFERENCE
        ? instrument.versions[0]?.status
          ? `V2 ${instrument.versions[0].status}`
          : "FRAMEWORK SETUP"
        : instrument.digitalSettlementInstruction?.settlementStatus ?? null,
    counterpartyName:
      instrument.digitalSettlementInstruction?.counterpartyName ?? null,
      operatorHref:
        instrument.reference === GLOBAL_MOTHER_V2_INSTRUMENT_REFERENCE
          ? "/admin/control-center/instruments/gm-kenya"
          : instrument.reference === DSI_REFERENCE &&
        instrument.digitalSettlementInstruction
          ? `/admin/control-center/instruments/digital-settlement/${encodeURIComponent(
              instrument.reference,
            )}`
          : null,
    }),
  );
}
