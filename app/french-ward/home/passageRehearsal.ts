import type {
  FrenchWardHomeMatter,
} from "@/domains/institutions/french-ward/home/contracts";

export function createPassageRehearsalMatters(now: Date): FrenchWardHomeMatter[] {
  const intake: FrenchWardHomeMatter = {
    id: "rehearsal-intake",
    reference: "FW-REHEARSAL-INTAKE",
    title: "Sample buyer intake",
    recordKind: "INTAKE",
    stage: "RECEIVED",
    state: "INTAKE_PENDING",
    commodity: null,
    origin: null,
    quantityKg: null,
    parties: [],
    lastMovement: null,
    pendingAttentionCount: 0,
  };

  const escrow: FrenchWardHomeMatter = {
    ...intake,
    id: "rehearsal-escrow",
    reference: "FW-REHEARSAL-ESCROW",
    title: "Sample escrow matter",
    recordKind: "DOSSIER",
    stage: "ACTIVE",
    state: "ESCROW_FUNDED",
  };

  return [
    intake,
    {
      ...escrow,
      lastMovement: {
        id: "rehearsal-movement",
        matterId: escrow.id,
        matterReference: escrow.reference,
        matterTitle: escrow.title,
        sourceRecord: {
          kind: escrow.recordKind,
          id: escrow.id,
          reference: escrow.reference,
        },
        sourceEventId: "rehearsal-event",
        message: "Sample escrow funding recorded.",
        actor: null,
        fromState: "ESCROW_PENDING",
        toState: escrow.state,
        occurredAt: new Date(now.getTime() - 86_400_000).toISOString(),
      },
    },
  ];
}
