import { prisma } from "@/lib/prisma";

type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" |
    "$disconnect" |
    "$on" |
    "$transaction" |
    "$use" |
    "$extends"
>;

export const DOSSIER_SPA_EXECUTION_CONFIRMED_EVENT =
  "DOSSIER_SPA_EXECUTION_CONFIRMED";

type SpaExecutionMetadata = {
  source: "control-center.spa-execution";
  disposition: "EXECUTED_AGREEMENT_CONFIRMED";
  instrumentId: string;
  instrumentType: "SPA";
  instrumentVersion: string;
  previousStatus: string;
  status: "EXECUTED";
  executedAt: string;
  buyerSignatory: string;
  sellerSignatory: string;
  evidenceReference: string;
  fileUrl: string | null;
  operatorEmail: string;
  doctrine: {
    instrumentStatusIsNotExecutionAuthority: true;
    executionConfirmationIsNotTransactionExecutionAuthority: true;
  };
};

export type SpaExecutionConfirmationEvent = {
  eventType: string;
  createdAt: Date | string;
  metadata?: unknown;
};

export type SpaExecutionInstrument = {
  id: string;
  type: string;
  status: string;
  version: string;
  fileUrl?: string | null;
};

function normalizeRequiredText(
  value: string | null | undefined,
  code: string,
) {
  const normalized =
    typeof value === "string"
      ? value.trim()
      : "";

  if (!normalized) {
    throw new Error(code);
  }

  return normalized;
}

function parseMetadata(
  value: unknown,
): Partial<SpaExecutionMetadata> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Partial<SpaExecutionMetadata>;
}

export function getSpaExecutionConfirmationStatus({
  instrument,
  events = [],
}: {
  instrument: SpaExecutionInstrument | null;
  events?: SpaExecutionConfirmationEvent[];
}) {
  if (!instrument || instrument.type !== "SPA") {
    return {
      confirmed: false,
      current: false,
      confirmedAt: null as string | null,
      event: null as SpaExecutionConfirmationEvent | null,
    };
  }

  const matchingEvents = events
    .filter(
      (event) =>
        event.eventType ===
        DOSSIER_SPA_EXECUTION_CONFIRMED_EVENT,
    )
    .filter((event) => {
      const metadata =
        parseMetadata(event.metadata);

      return (
        metadata?.instrumentId === instrument.id &&
        metadata?.instrumentVersion === instrument.version &&
        metadata?.status === "EXECUTED"
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );

  const event =
    matchingEvents[0] ?? null;

  const confirmed =
    Boolean(event);

  const current =
    confirmed &&
    instrument.status === "EXECUTED";

  return {
    confirmed,
    current,
    confirmedAt: event
      ? new Date(event.createdAt).toISOString()
      : null,
    event,
  };
}

export async function confirmDossierSpaExecution({
  dossierId,
  operatorEmail,
  executedAt,
  buyerSignatory,
  sellerSignatory,
  evidenceReference,
  fileUrl,
}: {
  dossierId: string;
  operatorEmail: string;
  executedAt: string;
  buyerSignatory: string;
  sellerSignatory: string;
  evidenceReference: string;
  fileUrl?: string | null;
}) {
  const normalizedBuyerSignatory =
    normalizeRequiredText(
      buyerSignatory,
      "SPA_BUYER_SIGNATORY_REQUIRED",
    );

  const normalizedSellerSignatory =
    normalizeRequiredText(
      sellerSignatory,
      "SPA_SELLER_SIGNATORY_REQUIRED",
    );

  const normalizedEvidenceReference =
    normalizeRequiredText(
      evidenceReference,
      "SPA_EXECUTION_EVIDENCE_REFERENCE_REQUIRED",
    );

  const parsedExecutedAt =
    new Date(executedAt);

  if (
    Number.isNaN(
      parsedExecutedAt.getTime(),
    )
  ) {
    throw new Error(
      "SPA_EXECUTED_AT_INVALID",
    );
  }

  const dossier =
    await prisma.transactionDossier.findUnique({
      where: {
        id: dossierId,
      },
      include: {
        instruments: {
          where: {
            type: "SPA",
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        events: {
          where: {
            eventType:
              DOSSIER_SPA_EXECUTION_CONFIRMED_EVENT,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  if (!dossier) {
    throw new Error(
      "DOSSIER_NOT_FOUND",
    );
  }

  if (dossier.state !== "SPA_DRAFTING") {
    throw new Error(
      "SPA_DRAFTING_NOT_ACTIVE",
    );
  }

  const instrument =
    dossier.instruments[0] ?? null;

  if (!instrument) {
    throw new Error(
      "SPA_INSTRUMENT_NOT_FOUND",
    );
  }

  const existingConfirmation =
    getSpaExecutionConfirmationStatus({
      instrument,
      events: dossier.events,
    });

  if (
    existingConfirmation.current
  ) {
    return {
      changed: false,
      alreadyConfirmed: true,
      instrument,
      confirmation:
        existingConfirmation,
    };
  }

  if (instrument.status !== "ACTIVE") {
    throw new Error(
      "SPA_MUST_BE_ACTIVE_BEFORE_EXECUTION_CONFIRMATION",
    );
  }

  const normalizedFileUrl =
    typeof fileUrl === "string" &&
    fileUrl.trim()
      ? fileUrl.trim()
      : instrument.fileUrl ?? null;

  const metadata: SpaExecutionMetadata = {
    source:
      "control-center.spa-execution",
    disposition:
      "EXECUTED_AGREEMENT_CONFIRMED",
    instrumentId:
      instrument.id,
    instrumentType:
      "SPA",
    instrumentVersion:
      instrument.version,
    previousStatus:
      instrument.status,
    status:
      "EXECUTED",
    executedAt:
      parsedExecutedAt.toISOString(),
    buyerSignatory:
      normalizedBuyerSignatory,
    sellerSignatory:
      normalizedSellerSignatory,
    evidenceReference:
      normalizedEvidenceReference,
    fileUrl:
      normalizedFileUrl,
    operatorEmail,
    doctrine: {
      instrumentStatusIsNotExecutionAuthority:
        true,
      executionConfirmationIsNotTransactionExecutionAuthority:
        true,
    },
  };

  const result =
    await prisma.$transaction(
      async (
        tx: PrismaTransactionClient,
      ) => {
        const currentInstrument =
          await tx.transactionDossierInstrument.findUnique({
            where: {
              id: instrument.id,
            },
          });

        if (!currentInstrument) {
          throw new Error(
            "SPA_INSTRUMENT_NOT_FOUND",
          );
        }

        if (
          currentInstrument.status !==
          "ACTIVE"
        ) {
          throw new Error(
            "SPA_MUST_BE_ACTIVE_BEFORE_EXECUTION_CONFIRMATION",
          );
        }

        const updatedInstrument =
          await tx.transactionDossierInstrument.update({
            where: {
              id: currentInstrument.id,
            },
            data: {
              status: "EXECUTED",
              fileUrl:
                normalizedFileUrl,
            },
          });

        const event =
          await tx.transactionDossierEvent.create({
            data: {
              dossierId:
                dossier.id,
              eventType:
                DOSSIER_SPA_EXECUTION_CONFIRMED_EVENT,
              fromState:
                "SPA_DRAFTING",
              toState:
                "SPA_DRAFTING",
              message:
                "Executed SPA evidence reviewed and confirmed for dossier progression.",
              actor:
                operatorEmail,
              metadata,
            },
          });

        return {
          instrument:
            updatedInstrument,
          event,
        };
      },
    );

  return {
    changed: true,
    alreadyConfirmed: false,
    instrument:
      result.instrument,
    event:
      result.event,
    confirmation:
      getSpaExecutionConfirmationStatus({
        instrument:
          result.instrument,
        events: [
          result.event,
        ],
      }),
  };
}
