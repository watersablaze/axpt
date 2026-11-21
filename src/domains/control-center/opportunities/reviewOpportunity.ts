import { prisma } from "@/lib/prisma";

import {
  canTransitionOpportunityReviewStatus,
  isOpportunityReviewStatus,
  type OpportunityReviewStatus,
} from "./opportunityStatuses";

import type {
  OpportunityEventType,
} from "./types";

type Input = {
  opportunityId: string;
  toStatus: string;
  actorEmail: string;
  note?: string | null;
};

type Result = {
  opportunityId: string;
  fromStatus: string;
  toStatus: OpportunityReviewStatus;
};

function eventTypeForStatus(
  status: OpportunityReviewStatus,
): OpportunityEventType {
  switch (status) {
    case "UNDER_REVIEW":
      return "OPPORTUNITY_REVIEWED";

    case "APPROVED":
      return "OPPORTUNITY_APPROVED";

    case "REJECTED":
      return "OPPORTUNITY_REJECTED";

    case "ARCHIVED":
      return "OPPORTUNITY_ARCHIVED";

    case "INTAKE":
    default:
      return "OPPORTUNITY_UPDATED";
  }
}

function messageForStatus(
  status: OpportunityReviewStatus,
) {
  switch (status) {
    case "UNDER_REVIEW":
      return "Opportunity entered commercial review.";

    case "APPROVED":
      return "Opportunity approved for dossier creation.";

    case "REJECTED":
      return "Opportunity rejected during commercial review.";

    case "ARCHIVED":
      return "Opportunity archived.";

    case "INTAKE":
    default:
      return "Opportunity review state updated.";
  }
}

export async function reviewOpportunity({
  opportunityId,
  toStatus,
  actorEmail,
  note,
}: Input): Promise<Result> {
  if (!isOpportunityReviewStatus(toStatus)) {
    throw new Error(
      `OPPORTUNITY_REVIEW_STATUS_NOT_ALLOWED:${toStatus}`,
    );
  }

  return prisma.$transaction(async (tx: typeof prisma) => {
    const opportunity =
      await tx.opportunity.findUnique({
        where: {
          id: opportunityId,
        },
      });

    if (!opportunity) {
      throw new Error("OPPORTUNITY_NOT_FOUND");
    }

    if (opportunity.status === "PROMOTED") {
      throw new Error(
        "PROMOTED_OPPORTUNITY_REVIEW_LOCKED",
      );
    }

    if (
      !canTransitionOpportunityReviewStatus(
        opportunity.status,
        toStatus,
      )
    ) {
      throw new Error(
        `OPPORTUNITY_REVIEW_TRANSITION_NOT_ALLOWED:${opportunity.status}:${toStatus}`,
      );
    }

    if (opportunity.status === toStatus) {
      return {
        opportunityId: opportunity.id,
        fromStatus: opportunity.status,
        toStatus,
      };
    }

    const fromStatus = opportunity.status;

    await tx.opportunity.update({
      where: {
        id: opportunity.id,
      },
      data: {
        status: toStatus,
      },
    });

    await tx.opportunityEvent.create({
      data: {
        opportunityId: opportunity.id,
        type: eventTypeForStatus(toStatus),
        actor: actorEmail,
        message: messageForStatus(toStatus),
        metadata: {
          source: "opportunity.review",
          fromStatus,
          toStatus,
          note:
            typeof note === "string" &&
            note.trim().length > 0
              ? note.trim()
              : null,
        },
      },
    });

    return {
      opportunityId: opportunity.id,
      fromStatus,
      toStatus,
    };
  });
}
