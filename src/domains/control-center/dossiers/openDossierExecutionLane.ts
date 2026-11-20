import { prisma } from "@/lib/prisma";

import { EventTypes } from "@/core/events/types";

import {
  checkDossierApprovalGate,
  getTransitionKey,
} from "@/domains/control-center/dossierApprovalGates";

import {
  checkDossierArtifactGate,
} from "@/domains/control-center/dossierArtifactGates";

import {
  getAvailableDossierTransitions,
} from "@/domains/control-center/getAvailableDossierTransitions";

import {
  inferDossierExecutionProfile,
} from "@/domains/control-center/inferDossierExecutionProfile";

import {
  getTransitionRegistryEntry,
} from "@/domains/control-center/transitionRegistry";

export const DOSSIER_EXECUTION_LANE_OPENED_EVENT =
  "DOSSIER_EXECUTION_LANE_OPENED";

export const DOSSIER_EXECUTION_LANE_TARGETS = [
  "ESCROW_PENDING",
  "PAYMENT_INSTRUCTION_PENDING",
  "CRYPTO_WALLET_CONFIRMATION",
  "FINANCIAL_INSTRUMENT_PENDING",
  "REFINERY_COORDINATION",
] as const;

export type DossierExecutionLaneTarget =
  (typeof DOSSIER_EXECUTION_LANE_TARGETS)[number];

export function isDossierExecutionLaneTarget(
  value: string,
): value is DossierExecutionLaneTarget {
  return (
    DOSSIER_EXECUTION_LANE_TARGETS as readonly string[]
  ).includes(value);
}

type OpenDossierExecutionLaneInput = {
  dossierId: string;
  toState: DossierExecutionLaneTarget;
  operatorEmail: string;
  operatorRoles: string[];
};

function metadataRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

export async function openDossierExecutionLane({
  dossierId,
  toState,
  operatorEmail,
  operatorRoles,
}: OpenDossierExecutionLaneInput) {
  return prisma.$transaction(async (tx: typeof prisma) => {
    const dossier =
      await tx.transactionDossier.findUnique({
        where: {
          id: dossierId,
        },
        include: {
          terms: true,
          instruments: true,
          approvalRequirements: true,
          parties: true,
          promotedOpportunities: {
            select: {
              id: true,
              source: true,
              title: true,
              sourceTransactionIntake: {
                select: {
                  transactionType: true,
                },
              },
            },
          },
          events: {
            where: {
              eventType:
                DOSSIER_EXECUTION_LANE_OPENED_EVENT,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
        },
      });

    if (!dossier) {
      throw new Error(
        "DOSSIER_NOT_FOUND",
      );
    }

    const sourceTransactionType =
      dossier.promotedOpportunities[0]
        ?.sourceTransactionIntake
        ?.transactionType ?? null;

    const executionProfile =
      inferDossierExecutionProfile({
        settlement:
          dossier.settlement,
        transactionType:
          sourceTransactionType,
        terms:
          dossier.terms,
      });

    const transitionKey =
      getTransitionKey(
        "SPA_EXECUTED",
        toState,
      );

    /*
     * Idempotency is only recognized when both:
     *
     * 1. dossier state is already the requested lane, and
     * 2. a canonical lane-open authority event exists.
     *
     * A legacy/bare state mutation is not silently promoted
     * into canonical authority.
     */
    if (dossier.state === toState) {
      const existingAuthorityEvent =
        dossier.events.find(
          (event: { metadata: unknown }) => {
            const metadata =
              metadataRecord(
                event.metadata,
              );

            return (
              metadata?.fromState ===
                "SPA_EXECUTED" &&
              metadata?.toState ===
                toState &&
              metadata?.transitionKey ===
                transitionKey
            );
          },
        );

      if (!existingAuthorityEvent) {
        throw new Error(
          "DOSSIER_EXECUTION_LANE_STATE_WITHOUT_AUTHORITY_EVENT",
        );
      }

      return {
        changed: false,
        alreadyOpened: true,
        dossier,
        lane: {
          executionProfile,
          fromState:
            "SPA_EXECUTED",
          toState,
          transitionKey,
        },
        generatedArtifacts: [],
        event:
          existingAuthorityEvent,
      };
    }

    if (
      dossier.state !==
      "SPA_EXECUTED"
    ) {
      throw new Error(
        "DOSSIER_NOT_READY_FOR_EXECUTION_LANE_OPEN",
      );
    }

    const availableTransitions =
      getAvailableDossierTransitions({
        state:
          dossier.state,
        settlement:
          dossier.settlement,
        transactionType:
          sourceTransactionType,
        terms:
          dossier.terms,
      });

    const allowedTransition =
      availableTransitions.find(
        (transition) =>
          transition.toState ===
          toState,
      );

    if (!allowedTransition) {
      throw new Error(
        "DOSSIER_EXECUTION_LANE_PROFILE_BLOCKED",
      );
    }

    const registryEntry =
      getTransitionRegistryEntry(
        transitionKey,
      );

    if (
      !registryEntry ||
      registryEntry.fromState !==
        "SPA_EXECUTED" ||
      registryEntry.toState !==
        toState
    ) {
      throw new Error(
        "DOSSIER_EXECUTION_LANE_REGISTRY_MISSING",
      );
    }

    const artifactGate =
      checkDossierArtifactGate({
        fromState:
          "SPA_EXECUTED",
        toState,
        instruments:
          dossier.instruments,
        parties:
          dossier.parties,
        sourceOpportunities:
          dossier.promotedOpportunities,
        events: [],
        origin:
          dossier.origin,
        settlement:
          dossier.settlement,
        executionProfile,
      });

    if (!artifactGate.passed) {
      throw new Error(
        "DOSSIER_EXECUTION_LANE_ARTIFACT_BLOCKED",
      );
    }

    const approvalGate =
      checkDossierApprovalGate({
        fromState:
          "SPA_EXECUTED",
        toState,
        operatorRoles,
        requirements:
          dossier.approvalRequirements,
      });

    if (!approvalGate.passed) {
      throw new Error(
        "DOSSIER_EXECUTION_LANE_APPROVAL_BLOCKED",
      );
    }

    /*
     * Conditional state mutation prevents two concurrent
     * lane-opening operations from both acquiring authority.
     *
     * Everything below is inside the same transaction.
     */
    const stateMutation =
      await tx.transactionDossier.updateMany({
        where: {
          id:
            dossier.id,
          state:
            "SPA_EXECUTED",
        },
        data: {
          state:
            toState,
        },
      });

    if (
      stateMutation.count !== 1
    ) {
      throw new Error(
        "DOSSIER_EXECUTION_LANE_STATE_CHANGED",
      );
    }

    const generatedArtifacts: Array<{
      disposition:
        | "CREATED"
        | "REUSED";
      instrument: {
        id: string;
        type: string;
        title: string;
        status: string;
        version: string;
      };
    }> = [];

    for (
      const artifact
      of registryEntry.generatedArtifacts
    ) {
      const existing =
        await tx.transactionDossierInstrument.findFirst({
          where: {
            dossierId:
              dossier.id,
            type:
              artifact.type,
            version:
              artifact.version,
          },
        });

      if (existing) {
        generatedArtifacts.push({
          disposition:
            "REUSED",
          instrument: {
            id:
              existing.id,
            type:
              existing.type,
            title:
              existing.title,
            status:
              existing.status,
            version:
              existing.version,
          },
        });

        continue;
      }

      const instrument =
        await tx.transactionDossierInstrument.create({
          data: {
            dossierId:
              dossier.id,
            type:
              artifact.type,
            title:
              artifact.title,
            status:
              artifact.status,
            version:
              artifact.version,
            notes:
              `Generated by canonical execution lane opening ${transitionKey} for ${dossier.reference} by ${operatorEmail}.`,
          },
        });

      await tx.transactionDossierEvent.create({
        data: {
          dossierId:
            dossier.id,
          eventType:
            EventTypes.INSTRUMENT_GENERATED,
          fromState:
            null,
          toState:
            null,
          message:
            `${artifact.title} generated when execution lane opened.`,
          actor:
            operatorEmail,
          metadata: {
            source:
              "control-center.execution-lane",
            transitionKey,
            instrumentId:
              instrument.id,
            instrumentType:
              instrument.type,
            instrumentVersion:
              instrument.version,
            disposition:
              "CREATED",
          },
        },
      });

      generatedArtifacts.push({
        disposition:
          "CREATED",
        instrument: {
          id:
            instrument.id,
          type:
            instrument.type,
          title:
            instrument.title,
          status:
            instrument.status,
          version:
            instrument.version,
        },
      });
    }

    const event =
      await tx.transactionDossierEvent.create({
        data: {
          dossierId:
            dossier.id,
          eventType:
            DOSSIER_EXECUTION_LANE_OPENED_EVENT,
          fromState:
            "SPA_EXECUTED",
          toState,
          message:
            `${executionProfile} execution lane opened from SPA_EXECUTED to ${toState}.`,
          actor:
            operatorEmail,
          metadata: {
            source:
              "control-center.execution-lane",
            executionProfile,
            transitionKey,
            fromState:
              "SPA_EXECUTED",
            toState,
            operatorEmail,

            doctrine: {
              profileSelectionIsNotLaneAuthorization:
                true,
              laneAuthorizationIsNotLaneOpening:
                true,
              laneOpeningIsNotLaneReadiness:
                true,
              laneReadinessIsNotValueConfirmation:
                true,
              laneOpeningIsNotTreasuryAuthority:
                true,
            },

            generatedArtifacts:
              generatedArtifacts.map(
                (artifact) => ({
                  disposition:
                    artifact.disposition,
                  instrumentId:
                    artifact.instrument.id,
                  type:
                    artifact.instrument.type,
                  version:
                    artifact.instrument.version,
                  status:
                    artifact.instrument.status,
                }),
              ),
          },
        },
      });

    const updated =
      await tx.transactionDossier.findUniqueOrThrow({
        where: {
          id:
            dossier.id,
        },
      });

    return {
      changed: true,
      alreadyOpened: false,
      dossier:
        updated,
      lane: {
        executionProfile,
        fromState:
          "SPA_EXECUTED",
        toState,
        transitionKey,
      },
      generatedArtifacts,
      event,
    };
  });
}
