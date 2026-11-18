import type { PrismaClient } from "@prisma/client";

import {
  readExternalIntakeProvenanceCorrection,
  resolveExternalIntakeProvenance,
} from "@/domains/control-center/transaction-intakes/resolveExternalIntakeProvenance";

import type {
  FrenchWardHomeMatter,
  FrenchWardHomeMovement,
} from "@/domains/institutions/french-ward/home/contracts";

type MatterReadClient = Pick<
  PrismaClient,
  | "institutionalMatter"
  | "transactionIntake"
>;

type IntakeEventRecord = {
  id: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  actor: string | null;
  note: string | null;
  createdAt: Date;
};

type IntakeRecord = {
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
  events: IntakeEventRecord[];
};

export type FrenchWardLoadedMatter = {
  matter: {
    id: string;
    reference: string;

    institutionalDomain: "FRENCH_WARD";

    institutionalPrincipal: {
      name: "French-Ward, Inc.";
    };

    coordinationEnvironment: "AXPT";

    matterKind: "COMMERCIAL_TRANSACTION";

    canonicalRecord: {
      kind: "INTAKE";
      id: string;
      reference: string;
    };
  };

  homeMatter: FrenchWardHomeMatter;
  intakeStatus?: string;
  currentOpportunityId?: string;

  movement: FrenchWardHomeMovement[];
};

function intakeTitle(
  intake: IntakeRecord,
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
  event: IntakeEventRecord,
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

  if (
    event.eventType ===
    "STATUS_CHANGED"
  ) {
    return "Transaction intake review status changed.";
  }

  if (
    event.eventType ===
    "INTERNAL_NOTE_UPDATED"
  ) {
    return "Internal transaction review updated.";
  }

  if (event.eventType === "PROMOTED_TO_OPPORTUNITY") {
    return "Matter advanced from Intake to Opportunity.";
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
  intake: IntakeRecord,
  event: IntakeEventRecord,
): FrenchWardHomeMovement {
  return {
    id: event.id,

    /*
     * Home movement identity now follows durable Matter identity,
     * not the lifecycle record identity.
     */
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

export async function loadFrenchWardMatterWithClient(
  params: {
    client: MatterReadClient;
    matterReference: string;
  },
): Promise<FrenchWardLoadedMatter | null> {
  const matterReference =
    params.matterReference.trim();

  if (!matterReference) {
    throw new Error(
      "FW_MATTER_REFERENCE_REQUIRED",
    );
  }

  const matter =
    await params.client.institutionalMatter.findUnique({
      where: {
        reference:
          matterReference,
      },

      select: {
        id: true,
        reference: true,

        institutionalDomain:
          true,

        institutionalPrincipal:
          true,

        coordinationEnvironment:
          true,

        matterKind:
          true,

        records: {
          where: { recordKind: "INTAKE" },
          select: { recordId: true, recordReference: true },
          take: 2,
        },

        currentRecordKind:
          true,

        currentRecordId:
          true,

        currentRecordReference:
          true,
      },
    });

  if (!matter) {
    return null;
  }

  if (
    matter.institutionalDomain !==
      "FRENCH_WARD" ||
    matter.institutionalPrincipal !==
      "French-Ward, Inc." ||
    matter.coordinationEnvironment !==
      "AXPT" ||
    matter.matterKind !==
      "COMMERCIAL_TRANSACTION"
  ) {
    throw new Error(
      "FW_MATTER_INSTITUTIONAL_CONTEXT_INVALID",
    );
  }

  const atOpportunity = matter.currentRecordKind === "OPPORTUNITY";
  if (matter.currentRecordKind !== "INTAKE" && !atOpportunity) {
    throw new Error("FW_MATTER_CURRENT_RECORD_KIND_UNSUPPORTED");
  }

  const [origin] = matter.records;
  if (atOpportunity && (!origin || matter.records.length !== 1)) {
    throw new Error("FW_MATTER_ORIGINAL_INTAKE_AMBIGUOUS");
  }
  const intakeId = atOpportunity && origin ? origin.recordId : matter.currentRecordId;
  const intakeReference = atOpportunity && origin ? origin.recordReference : matter.currentRecordReference;

  const intake =
    await params.client.transactionIntake.findUnique({
      where: {
        id:
          intakeId,
      },

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
        promotedOpportunity: {
          select: { id: true, title: true, status: true, commodity: true, origin: true, quantityKg: true },
        },

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
    });

  if (!intake) {
    throw new Error(
      "FW_MATTER_CURRENT_INTAKE_NOT_FOUND",
    );
  }

  if (
    intake.id !== intakeId || intake.reference !== intakeReference
  ) {
    throw new Error(
      "FW_MATTER_CURRENT_RECORD_IDENTITY_MISMATCH",
    );
  }

  const opportunity = atOpportunity ? intake.promotedOpportunity : null;
  if (atOpportunity && (!opportunity ||
      opportunity.id !== matter.currentRecordId ||
      opportunity.id !== matter.currentRecordReference)) {
    throw new Error("FW_MATTER_CURRENT_OPPORTUNITY_IDENTITY_MISMATCH");
  }

  const typedIntake =
    intake as IntakeRecord;

  const provenance =
    resolveExternalIntakeProvenance(
      typedIntake.events,
    );

  const parties:
    FrenchWardHomeMatter["parties"] =
      [];

  if (typedIntake.buyerName) {
    parties.push({
      role: "BUYER",
      legalName:
        typedIntake.buyerName,
    });
  }

  if (typedIntake.sellerName) {
    parties.push({
      role: "SELLER",
      legalName:
        typedIntake.sellerName,
    });
  }

  if (
    provenance?.introductionChannelName
  ) {
    parties.push({
      role: "INTRODUCTION_CHANNEL",
      legalName:
        provenance.introductionChannelName,
    });
  }

  const movement =
    typedIntake.events.map(
      event =>
        movementFromIntakeEvent(
          {
            id:
              matter.id,

            reference:
              matter.reference,
          },
          typedIntake,
          event,
        ),
    );

  const latestMovement =
    movement[0] ?? null;

  const homeMatter:
    FrenchWardHomeMatter = {
      /*
       * These fields now identify the durable Matter.
       */
      id:
        matter.id,

      reference:
        matter.reference,

      title:
        intakeTitle(
          typedIntake,
        ),

      /*
       * Lifecycle truth still comes from the canonical Intake.
       */
      recordKind:
        "INTAKE",

      stage:
        "RECEIVED",

      state:
        typedIntake.status,

      commodity:
        typedIntake.commodity,

      origin:
        typedIntake.origin,

      quantityKg:
        typedIntake.trialQuantity ||
        typedIntake.quantity,

      parties,

      lastMovement:
        latestMovement,

      pendingAttentionCount:
        0,
    };

  return {
    matter: {
      id:
        matter.id,

      reference:
        matter.reference,

      institutionalDomain:
        "FRENCH_WARD",

      institutionalPrincipal: {
        name:
          "French-Ward, Inc.",
      },

      coordinationEnvironment:
        "AXPT",

      matterKind:
        "COMMERCIAL_TRANSACTION",

      canonicalRecord: {
        kind:
          "INTAKE",

        id:
          typedIntake.id,

        reference:
          typedIntake.reference,
      },
    },

    homeMatter: opportunity ? {
      ...homeMatter,
      title: opportunity.title,
      recordKind: "OPPORTUNITY",
      stage: "EMERGING",
      state: opportunity.status,
      commodity: opportunity.commodity,
      origin: opportunity.origin,
      quantityKg: opportunity.quantityKg,
    } : homeMatter,
    intakeStatus: typedIntake.status,
    currentOpportunityId: opportunity?.id,

    movement,
  };
}
