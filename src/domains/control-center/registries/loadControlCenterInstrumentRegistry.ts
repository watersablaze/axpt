import "server-only";

import { DSI_REFERENCE } from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { globalMotherV4Definition } from "@/domains/instruments/definitions/globalMotherV4Definition";
import { prisma } from "@/infrastructure/db/prisma";

export type ControlCenterInstrumentRegistryEntry = {
  reference: string;
  family: "INSTITUTIONAL_INSTRUMENT" | "COMMERCIAL_EDITION";
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
  const [instruments, commercialEditions] = await Promise.all([prisma.institutionalInstrument.findMany({
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
        where: { number: globalMotherV4Definition.version },
        select: { status: true },
      },
    },
  }), prisma.gsamScoEdition.findMany({
    select: { reference: true, quantityMt: true, state: true, createdAt: true },
    orderBy: [{ quantityMt: "asc" }, { reference: "asc" }],
  })]);

  const canonical = instruments.map(
    (instrument: ControlCenterInstrumentRegistryRow) => ({
    reference: instrument.reference,
    family: "INSTITUTIONAL_INSTRUMENT" as const,
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
        : instrument.digitalSettlementInstruction?.settlementStatus ?? null,
    counterpartyName:
      instrument.digitalSettlementInstruction?.counterpartyName ?? null,
      operatorHref:
        instrument.reference === globalMotherV4Definition.reference
          ? "/admin/control-center/instruments/gm-kenya"
          : instrument.reference === DSI_REFERENCE &&
        instrument.digitalSettlementInstruction
          ? `/admin/control-center/instruments/digital-settlement/${encodeURIComponent(
              instrument.reference,
            )}`
          : null,
    }),
  );

  // The directory composes read-only projections; neither registry owns the other.
  // An edition being delivered does not alter its documentary CANDIDATE state.
  const editions: ControlCenterInstrumentRegistryEntry[] = commercialEditions.map((edition: { reference: string; quantityMt: number; state: string; createdAt: Date }) => ({
    reference: edition.reference,
    family: "COMMERCIAL_EDITION",
    kind: "SOFT_CORPORATE_OFFER",
    title: `Growthcorp Solutions Asset Management Limited — ${edition.quantityMt.toLocaleString("en-US")} MT Soft Corporate Offer`,
    status: edition.state,
    currentVersion: edition.reference.endsWith("-002") ? 2 : 1,
    updatedAt: edition.createdAt,
    domainState: edition.reference.endsWith("-002")
      ? "EDITION 2 · VERIFIED CUSTODY"
      : "EARLIER REGISTRY CANDIDATE",
    counterpartyName: "Growthcorp Solutions Asset Management Limited",
    operatorHref: edition.reference.endsWith("-002") ? "/admin/instruments/gsam-sco/preview" : null,
  }));

  return [...canonical, ...editions];
}
