import type { PrismaClient } from "@prisma/client";

import {
  readExternalIntakeProvenanceCorrection,
  resolveExternalIntakeProvenance,
} from "@/domains/control-center/transaction-intakes/resolveExternalIntakeProvenance";

import {
  loadFrenchWardMatterWithClient,
} from "@/domains/institutions/french-ward/matters/loadFrenchWardMatterWithClient";

import {
  projectFrenchWardHomeDocuments,
} from "./projectFrenchWardHomeDocuments";

import type {
  FrenchWardHomeAttention,
  FrenchWardHomeMatter,
  FrenchWardHomeMovement,
  FrenchWardHomeParticipant,
  FrenchWardHomeProjection,
} from "./contracts";

type HomeIntakeEventRecord = {
  id: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  actor: string | null;
  note: string | null;
  createdAt: Date;
};

type HomeIntakeRecord = {
  id: string;
  reference: string;
  status: string;
  buyerName: string | null;
  sellerName: string | null;
  commodity: string | null;
  origin: string | null;
  destination: string | null;
  quantity: string | null;
  trialQuantity: string | null;
  submitterEmail: string;
  events: HomeIntakeEventRecord[];
};

type HomeOpportunityRecord = {
  id: string;
  title: string;
  status: string;
  commodity: string | null;
  buyerName: string | null;
  sellerName: string | null;
  origin: string | null;
  destination: string | null;
  quantityKg: string | null;
  createdAt: Date;
};

type HomeDossierPartyRecord = {
  role: string;
  legalName: string;
};

type HomeDossierApprovalRequirementRecord = {
  id: string;
};

type HomeDossierEventRecord = {
  id: string;
  eventType: string;
  message: string;
  actor: string | null;
  fromState: string | null;
  toState: string | null;
  createdAt: Date;
};

type HomeDossierRecord = {
  id: string;
  reference: string;
  title: string;
  state: string;
  commodity: string | null;
  origin: string | null;
  quantityKg: {
    toString(): string;
  } | null;
  parties: HomeDossierPartyRecord[];
  approvalRequirements: HomeDossierApprovalRequirementRecord[];
  events: HomeDossierEventRecord[];
};

const LEGACY_HOME_EXCLUDED_INTAKE_REFERENCES =
  new Set([
    "AXPT-INT-2026-LIAENU",
    "AXPT-INT-2026-DJDNO9",
    "AXPT-INT-2026-1J272S",
    "AXPT-INT-2026-YD4R92",
    "AXPT-INT-2026-OBNK61",
    "AXPT-INT-2026-MXDMLM",
    "AXPT-INT-2026-XI4VD8",
    "AXPT-INT-2026-DH7PN9",
    "AXPT-INT-2026-2LCZLA",
    "AXPT-INT-2026-IKRZVU",
    "AXPT-INT-2026-LAZV0R",
    "AXPT-INT-2026-C1TWBU",
  ]);

const CONFIRMED_TEST_BUYER_NAMES = new Set([
  "Test Buyer Company",
  "TRADING GOOD",
  "BG INDUSTRIES",
  "M BENSOM ENTERPRISE LLC",
]);

function isParticipantVisibleIntake(
  intake: HomeIntakeRecord,
) {
  const email =
    intake.submitterEmail.trim().toLowerCase();

  if (
    LEGACY_HOME_EXCLUDED_INTAKE_REFERENCES.has(
      intake.reference,
    )
  ) {
    return false;
  }

  if (
    email.endsWith(".test") ||
    email.includes("@example.test")
  ) {
    return false;
  }

  if (
    intake.buyerName &&
    CONFIRMED_TEST_BUYER_NAMES.has(
      intake.buyerName,
    )
  ) {
    return false;
  }

  return true;
}

function intakeTitle(
  intake: HomeIntakeRecord,
) {
  if (intake.buyerName) {
    return intake.commodity
      ? `${intake.buyerName} · ${intake.commodity}`
      : intake.buyerName;
  }

  return intake.commodity
    ? `${intake.commodity} intake`
    : "Transaction intake";
}

function intakeMovementMessage(
  event: HomeIntakeEventRecord,
) {
  if (
    event.eventType ===
    "EXTERNAL_INTAKE_REGISTERED"
  ) {
    return "External transaction intake registered.";
  }

  if (
    event.eventType ===
    "EXTERNAL_INTAKE_PROVENANCE_CORRECTED"
  ) {
    const correction =
      readExternalIntakeProvenanceCorrection(
        event.note,
      );

    if (
      correction?.field ===
      "introductionChannelName"
    ) {
      return [
        "Introduction channel corrected:",
        correction.from || "Not recorded",
        "→",
        correction.to,
      ].join(" ");
    }

    return "External intake provenance corrected.";
  }

  if (event.eventType === "STATUS_CHANGED") {
    return "Transaction intake review status changed.";
  }

  if (
    event.eventType ===
    "INTERNAL_NOTE_UPDATED"
  ) {
    return "Internal transaction review updated.";
  }

  return event.eventType
    .toLowerCase()
    .replaceAll("_", " ");
}

function movementFromIntakeEvent(
  matter: {
    id: string;
    reference: string;
  },
  intake: HomeIntakeRecord,
  event: HomeIntakeEventRecord,
): FrenchWardHomeMovement {
  return {
    id: event.id,

    matterId:
      matter.id,

    matterReference:
      matter.reference,

    matterTitle:
      intakeTitle(intake),

    sourceRecord: {
      kind:
        "INTAKE",

      id:
        intake.id,

      reference:
        intake.reference,
    },

    sourceEventId:
      event.id,

    message:
      intakeMovementMessage(event),

    actor:
      event.actor,

    fromState:
      event.fromStatus,

    toState:
      event.toStatus,

    occurredAt:
      event.createdAt.toISOString(),
  };
}

export async function loadFrenchWardHomeWithClient(params: {
  client: PrismaClient;
  participant: FrenchWardHomeParticipant;
}): Promise<FrenchWardHomeProjection> {
  const { client, participant } = params;

  const [
    intakeRecords,
    opportunityRecords,
    dossiers,
    dossierMovementEvents,
  ] = await Promise.all([
    client.transactionIntake.findMany({
      where: {
        promotedOpportunityId: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 40,
      select: {
        id: true,
        reference: true,
        status: true,
        buyerName: true,
        sellerName: true,
        commodity: true,
        origin: true,
        destination: true,
        quantity: true,
        trialQuantity: true,
        submitterEmail: true,

        events: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
          select: {
            id: true,
            eventType: true,
            fromStatus: true,
            toStatus: true,
            actor: true,
            note: true,
            createdAt: true,
          },
        },
      },
    }),

    client.opportunity.findMany({
      where: {
        promotedDossierId: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        commodity: true,
        buyerName: true,
        sellerName: true,
        origin: true,
        destination: true,
        quantityKg: true,
        createdAt: true,
      },
    }),

    client.transactionDossier.findMany({
      where: {
        state: {
          not: "CLOSED",
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        reference: true,
        title: true,
        state: true,
        commodity: true,
        origin: true,
        quantityKg: true,

        parties: {
          select: {
            role: true,
            legalName: true,
          },
        },

        approvalRequirements: {
          where: {
            status: {
              not: "SATISFIED",
            },
          },
          select: {
            id: true,
          },
        },

        events: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            eventType: true,
            message: true,
            actor: true,
            fromState: true,
            toState: true,
            createdAt: true,
          },
        },
      },
    }),

    client.transactionDossierEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        dossier: {
          select: {
            id: true,
            reference: true,
            title: true,
          },
        },
      },
    }),
  ]);

  const intakes = (
    intakeRecords as HomeIntakeRecord[]
  ).filter(isParticipantVisibleIntake);

  const opportunities =
    opportunityRecords as HomeOpportunityRecord[];

  const typedDossiers =
    dossiers as HomeDossierRecord[];

  /*
   * Intake-class participant Matters now begin with the durable
   * InstitutionalMatter aggregate.
   *
   * Raw TransactionIntake loading above remains temporarily in
   * place for existing Home movement / record projection only.
   * It no longer determines which Intake Matters appear in the
   * participant Matter field.
   */
  const durableIntakeMatterRecords =
    await client.institutionalMatter.findMany({
      where: {
        institutionalDomain:
          "FRENCH_WARD",

        institutionalPrincipal:
          "French-Ward, Inc.",

        coordinationEnvironment:
          "AXPT",

        matterKind:
          "COMMERCIAL_TRANSACTION",

        currentRecordKind:
          "INTAKE",
      },

      orderBy: {
        updatedAt:
          "desc",
      },

      take:
        40,

      select: {
        reference:
          true,
      },
    });

  const loadedDurableIntakeMatters =
    await Promise.all(
      durableIntakeMatterRecords.map(
        async (matter: { reference: string }) => {
          const loaded =
            await loadFrenchWardMatterWithClient({
              client,

              matterReference:
                matter.reference,
            });

          /*
           * The row was discovered from InstitutionalMatter.
           * Never fall back to manufacturing a participant Matter
           * from the lifecycle record if continuity disappears.
           */
          if (!loaded) {
            throw new Error(
              "FW_HOME_DURABLE_MATTER_DISAPPEARED",
            );
          }

          return loaded;
        },
      ),
    );

  const intakeMatters:
    FrenchWardHomeMatter[] =
      loadedDurableIntakeMatters.map(
        loaded =>
          loaded.homeMatter,
      );

  /*
   * Canonical Intake identity remains available only as the
   * provenance bridge from lifecycle events into durable Matter
   * continuity.
   */
  const intakeMatterByCanonicalIntakeId =
    new Map(
      loadedDurableIntakeMatters.map(
        loaded => [
          loaded.matter.canonicalRecord.id,
          loaded,
        ] as const,
      ),
    );

  const opportunityMatters:
    FrenchWardHomeMatter[] =
    opportunities.map((opportunity) => {
      const parties: FrenchWardHomeMatter["parties"] =
        [];

      if (opportunity.buyerName) {
        parties.push({
          role: "BUYER",
          legalName: opportunity.buyerName,
        });
      }

      if (opportunity.sellerName) {
        parties.push({
          role: "SELLER",
          legalName: opportunity.sellerName,
        });
      }

      return {
        id: opportunity.id,
        reference: opportunity.id,
        title: opportunity.title,

        recordKind: "OPPORTUNITY",
        stage: "EMERGING",
        state: opportunity.status,

        commodity: opportunity.commodity,
        origin: opportunity.origin,
        quantityKg: opportunity.quantityKg,

        parties,
        lastMovement: null,
        pendingAttentionCount: 0,
      };
    });

  const dossierMatters:
    FrenchWardHomeMatter[] =
    typedDossiers.map((dossier) => {
      const event = dossier.events[0];

      return {
        id: dossier.id,
        reference: dossier.reference,
        title: dossier.title,

        recordKind: "DOSSIER",
        stage: "ACTIVE",
        state: dossier.state,

        commodity: dossier.commodity,
        origin: dossier.origin,
        quantityKg:
          dossier.quantityKg?.toString() ??
          null,

        parties: dossier.parties.map(
          (party) => ({
            role: party.role,
            legalName: party.legalName,
          }),
        ),

        lastMovement: event
          ? {
              id: event.id,
              matterId: dossier.id,
              matterReference:
                dossier.reference,
              matterTitle: dossier.title,

              sourceRecord: {
                kind:
                  "DOSSIER",

                id:
                  dossier.id,

                reference:
                  dossier.reference,
              },

              sourceEventId:
                event.id,

              message: event.message,
              actor: event.actor,
              fromState: event.fromState,
              toState: event.toState,
              occurredAt:
                event.createdAt.toISOString(),
            }
          : null,

        pendingAttentionCount:
          dossier.approvalRequirements.length,
      };
    });

  const intakeMovement =
    intakes.flatMap((intake) => {
      const situatedMatter =
        intakeMatterByCanonicalIntakeId.get(
          intake.id,
        );

      /*
       * An Intake event enters the participant Matter movement
       * field only when the Intake is situated under a durable
       * InstitutionalMatter.
       *
       * The Intake remains the canonical event source.
       */
      if (!situatedMatter) {
        return [];
      }

      return intake.events.map(
        event =>
          movementFromIntakeEvent(
            {
              id:
                situatedMatter.matter.id,

              reference:
                situatedMatter.matter.reference,
            },
            intake,
            event,
          ),
      );
    });

  const dossierMovement: FrenchWardHomeMovement[] =
    dossierMovementEvents.map(
      (
        event: (typeof dossierMovementEvents)[number],
      ) => ({
        id: event.id,
        matterId: event.dossier.id,
        matterReference:
          event.dossier.reference,
        matterTitle: event.dossier.title,

        sourceRecord: {
          kind:
            "DOSSIER",

          id:
            event.dossier.id,

          reference:
            event.dossier.reference,
        },

        sourceEventId:
          event.id,

        message: event.message,
        actor: event.actor,
        fromState: event.fromState,
        toState: event.toState,
        occurredAt:
          event.createdAt.toISOString(),
      }),
    );

  const recentMovement = [
    ...intakeMovement,
    ...dossierMovement,
  ]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() -
        new Date(a.occurredAt).getTime(),
    )
    .slice(0, 20);

  const attention:
    FrenchWardHomeAttention[] =
    typedDossiers.flatMap((dossier) => {
      const count =
        dossier.approvalRequirements.length;

      if (count === 0) {
        return [];
      }

      return [{
        matterId: dossier.id,
        matterReference:
          dossier.reference,
        matterTitle: dossier.title,
        kind: "PENDING_APPROVAL" as const,
        label:
          count === 1
            ? "1 institutional requirement remains unresolved."
            : `${count} institutional requirements remain unresolved.`,
      }];
    });

  return {
    participant,

    institution: {
      name: "French-Ward, Inc.",
    },

    matters: [
      ...intakeMatters,
      ...opportunityMatters,
      ...dossierMatters,
    ],

    attention,
    recentMovement,
    documents:
      (
        participant.kind === "GOVERNING" ||
        participant.kind === "INSTITUTIONAL" ||
        participant.kind === "ADMINISTRATIVE_REVIEW"
      )
        ? projectFrenchWardHomeDocuments()
        : [],
  };
}
