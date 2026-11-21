import type { PrismaClient } from "@prisma/client";
import { globalMotherCycleV2Plan } from "@/domains/instruments/definitions/globalMotherCycleV2Plan";

/** Internal discovery only. Caller must enforce operator authorization before invoking. */
export type ChamberHomeWorkstreamClient = Pick<PrismaClient, "globalMotherChamberRoomBinding">;

export type ChamberHomeWorkstream = {
  linkId: string;
  targetType: "CASE" | "OPPORTUNITY" | "TRANSACTION_DOSSIER";
  targetSubtype: string;
  targetId: string;
  linkedByUserId: string;
  linkedAt: Date;
  disclosure: "LINK_METADATA_ONLY";
};

export type ChamberHomeWorkstreamResult =
  | { standing: "NOT_ESTABLISHED" | "REVIEW_REQUIRED"; workstreams: []; operationallyUsable: false }
  | {
      standing: "ESTABLISHED";
      instrumentReference: string;
      cycleLabel: string;
      roomId: string;
      workstreams: ChamberHomeWorkstream[];
      excludedLinkCount: number;
      operationallyUsable: false;
    };

const ALLOWED_TARGETS = new Set(["CASE", "OPPORTUNITY", "TRANSACTION_DOSSIER"]);

export async function loadGlobalMotherChamberHomeWorkstreamsWithClient(
  client: ChamberHomeWorkstreamClient,
): Promise<ChamberHomeWorkstreamResult> {
  const plan = globalMotherCycleV2Plan;
  const binding = await client.globalMotherChamberRoomBinding.findUnique({
    where: {
      instrumentReference_cycleLabel: {
        instrumentReference: plan.instrumentReference,
        cycleLabel: plan.cycleLabel,
      },
    },
    select: {
      standing: true,
      operationalRoom: {
        select: {
          id: true,
          clientRoomId: true,
          roomClass: true,
          conversation: { select: { title: true, status: true } },
          links: {
            select: {
              id: true,
              roomId: true,
              targetType: true,
              targetSubtype: true,
              targetId: true,
              linkedByUserId: true,
              linkedAt: true,
            },
            orderBy: [{ linkedAt: "asc" }, { id: "asc" }],
          },
        },
      },
    },
  });

  if (!binding) return { standing: "NOT_ESTABLISHED", workstreams: [], operationallyUsable: false };
  const room = binding.operationalRoom;
  if (
    binding.standing !== "BOUND" ||
    !room ||
    room.clientRoomId !== plan.communications.clientRoomId ||
    room.roomClass !== plan.communications.roomClass ||
    room.conversation.title !== plan.communications.label ||
    room.conversation.status !== "ACTIVE" ||
    room.links.some((link: { roomId: string }) => link.roomId !== room.id)
  ) {
    return { standing: "REVIEW_REQUIRED", workstreams: [], operationallyUsable: false };
  }

  const workstreams: ChamberHomeWorkstream[] = [];
  let excludedLinkCount = 0;
  for (const link of room.links) {
    if (!ALLOWED_TARGETS.has(link.targetType)) {
      excludedLinkCount++;
      continue;
    }
    // These identifiers are internal link metadata, not an authorization or target read.
    workstreams.push({
      linkId: link.id,
      targetType: link.targetType as ChamberHomeWorkstream["targetType"],
      targetSubtype: link.targetSubtype,
      targetId: link.targetId,
      linkedByUserId: link.linkedByUserId,
      linkedAt: link.linkedAt,
      disclosure: "LINK_METADATA_ONLY",
    });
  }

  return {
    standing: "ESTABLISHED",
    instrumentReference: plan.instrumentReference,
    cycleLabel: plan.cycleLabel,
    roomId: room.id,
    workstreams,
    excludedLinkCount,
    operationallyUsable: false,
  };
}
