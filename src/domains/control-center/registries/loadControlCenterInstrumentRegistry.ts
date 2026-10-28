import "server-only";

import { DSI_REFERENCE } from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { globalMotherV4Definition } from "@/domains/instruments/definitions/globalMotherV4Definition";
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
  id: string;
  reference: string;
  kind: string;
  title: string;
  status: string;
  currentVersion: number;
  updatedAt: Date;
  versions: { status: string }[];
};

type DigitalSettlementRegistryState = {
  settlementStatus: string;
  counterpartyName: string;
};

export async function loadControlCenterInstrumentRegistry(): Promise<
  readonly ControlCenterInstrumentRegistryEntry[]
> {
  /*
   * Read the institutional spine independently of optional specialization
   * tables. A registry containing only non-DSI instruments must not require
   * the DigitalSettlementInstruction runtime table to exist.
   */
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
      id: true,
      reference: true,
      kind: true,
      title: true,
      status: true,
      currentVersion: true,
      updatedAt: true,
      versions: {
        where: { number: globalMotherV4Definition.version },
        select: { status: true },
      },
    },
  });

  const dsiInstrument = instruments.find(
    (instrument: ControlCenterInstrumentRegistryRow) =>
      instrument.reference === DSI_REFERENCE,
  );

  let digitalSettlementState: DigitalSettlementRegistryState | null = null;

  /*
   * Specialization remains strict when the canonical DSI is actually
   * registered. In that case, absence of its specialization record is a
   * domain inconsistency and should remain visible rather than degrading
   * silently.
   */
  if (dsiInstrument) {
    digitalSettlementState =
      await prisma.digitalSettlementInstruction.findUnique({
        where: {
          instrumentId: dsiInstrument.id,
        },
        select: {
          settlementStatus: true,
          counterpartyName: true,
        },
      });

    if (!digitalSettlementState) {
      throw new Error(
        `Digital settlement specialization missing for ${DSI_REFERENCE}`,
      );
    }
  }

  return instruments.map(
    (instrument: ControlCenterInstrumentRegistryRow) => {
      const isDigitalSettlementInstruction =
        instrument.reference === DSI_REFERENCE;

      const dsiState = isDigitalSettlementInstruction
        ? digitalSettlementState
        : null;

      return {
        reference: instrument.reference,
        kind: instrument.kind,
        title: instrument.title,
        status: instrument.status,
        currentVersion: instrument.currentVersion,
        updatedAt: instrument.updatedAt,
        domainState:
          instrument.reference === globalMotherV4Definition.reference
            ? instrument.versions[0]?.status
              ? `V${globalMotherV4Definition.version} ${instrument.versions[0].status}`
              : "FRAMEWORK SETUP"
            : dsiState?.settlementStatus ?? null,
        counterpartyName: dsiState?.counterpartyName ?? null,
        operatorHref:
          instrument.reference === globalMotherV4Definition.reference
            ? "/admin/control-center/instruments/gm-kenya"
            : isDigitalSettlementInstruction && dsiState
              ? `/admin/control-center/instruments/digital-settlement/${encodeURIComponent(
                  instrument.reference,
                )}`
              : null,
      };
    },
  );
}
