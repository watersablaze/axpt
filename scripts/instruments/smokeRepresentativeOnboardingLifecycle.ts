import assert from "node:assert/strict";

import {
  REPRESENTATIVE_ONBOARDING_STATUS,
  REPRESENTATIVE_QUALIFICATION_DECISION,
  type RepresentativeOnboardingSubmission,
} from "../../src/domains/instruments/representative-program/onboarding/contracts";

import { hashRepresentativeOnboardingAccessToken } from "../../src/domains/instruments/representative-program/onboarding/accessToken";

import {
  submitRepresentativeOnboarding,
  beginRepresentativeOnboardingReview,
  qualifyRepresentativeOnboarding,
  returnRepresentativeOnboardingForCompletion,
  declineRepresentativeOnboarding,
} from "../../src/domains/instruments/representative-program/onboarding/commands/representativeOnboardingLifecycle";

import { admitRepresentativeOnboarding } from "../../src/domains/instruments/representative-program/onboarding/commands/admitRepresentativeOnboarding";

import {
  resolveRepresentativeOnboardingAccessWithClient,
  REPRESENTATIVE_ONBOARDING_ACCESS_REASON,
} from "../../src/domains/instruments/representative-program/onboarding/queries/resolveRepresentativeOnboardingAccessWithClient";

type Intake = {
  id: string;
  reference: string;
  status: string;
  qualificationDecision: string;
  candidateDisplayName: string;
  candidateEmail: string;
  submission: unknown | null;
  internalNotes: string | null;
  accessTokenHash: string | null;
  accessIssuedAt: Date | null;
  accessExpiresAt: Date | null;
  accessRevokedAt: Date | null;
  submittedAt: Date | null;
  reviewStartedAt: Date | null;
  qualifiedAt: Date | null;
  admittedAt: Date | null;
  admittedParticipantId: string | null;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Transition = {
  id: string;
  intakeId: string;
  fromStatus: string | null;
  toStatus: string;
  actorUserId: string | null;
  reason: string | null;
  metadata: unknown | null;
  occurredAt: Date;
  createdAt: Date;
};

type Participant = {
  id: string;
  docketReference: string;
  userId: string | null;
  displayName: string;
  standing: string;
  admittedAt: Date | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

function cloneDate(value: Date | null): Date | null {
  return value ? new Date(value.getTime()) : null;
}

function cloneIntake(value: Intake): Intake {
  return {
    ...value,
    accessIssuedAt: cloneDate(value.accessIssuedAt),
    accessExpiresAt: cloneDate(value.accessExpiresAt),
    accessRevokedAt: cloneDate(value.accessRevokedAt),
    submittedAt: cloneDate(value.submittedAt),
    reviewStartedAt: cloneDate(value.reviewStartedAt),
    qualifiedAt: cloneDate(value.qualifiedAt),
    admittedAt: cloneDate(value.admittedAt),
    createdAt: new Date(value.createdAt),
    updatedAt: new Date(value.updatedAt),
  };
}

function cloneTransition(value: Transition): Transition {
  return {
    ...value,
    occurredAt: new Date(value.occurredAt),
    createdAt: new Date(value.createdAt),
  };
}

function cloneParticipant(value: Participant): Participant {
  return {
    ...value,
    admittedAt: cloneDate(value.admittedAt),
    createdAt: new Date(value.createdAt),
    updatedAt: new Date(value.updatedAt),
  };
}

const now = new Date("2026-09-21T12:00:00.000Z");

const submission: RepresentativeOnboardingSubmission = {
  identity: {
    fullLegalName: "Jens Pilot",
    email: "jens@example.test",
  },
  professionalProfile: {},
  representationContext: {},
  disclosures: {},
  acknowledgements: {
    noImpliedAuthority: true,
    noUnauthorizedCommercialTermChanges: true,
    noImpersonationOfFrenchWard: true,
    noUnauthorizedSubdelegation: true,
    confidentialityAcknowledged: true,
    writtenAppointmentControlsAuthority: true,
    informationAccurateToBestKnowledge: true,
  },
};

const state = {
  intakes: new Map<string, Intake>(),
  transitions: [] as Transition[],
  participants: new Map<string, Participant>(),
  standingTransitions: [] as unknown[],
  docketNextByYear: new Map<number, number>(),

  transitionCounter: 0,
  participantCounter: 0,

  failNextOnboardingTransitionCreate: false,

  appointmentCreates: 0,
  authorityCreates: 0,
};

function seedIntake(params?: Partial<Intake>): Intake {
  const intake: Intake = {
    id: params?.id ?? "intake-1",
    reference: params?.reference ?? "FWI-26-RP-ONB-SMOKE01",
    status: params?.status ?? REPRESENTATIVE_ONBOARDING_STATUS.DRAFT,
    qualificationDecision:
      params?.qualificationDecision ??
      REPRESENTATIVE_QUALIFICATION_DECISION.PENDING,
    candidateDisplayName: params?.candidateDisplayName ?? "Jens Pilot",
    candidateEmail: params?.candidateEmail ?? "jens@example.test",
    submission: params?.submission ?? null,
    internalNotes: params?.internalNotes ?? null,
    accessTokenHash: params?.accessTokenHash ?? null,
    accessIssuedAt: params?.accessIssuedAt ?? null,
    accessExpiresAt: params?.accessExpiresAt ?? null,
    accessRevokedAt: params?.accessRevokedAt ?? null,
    submittedAt: params?.submittedAt ?? null,
    reviewStartedAt: params?.reviewStartedAt ?? null,
    qualifiedAt: params?.qualifiedAt ?? null,
    admittedAt: params?.admittedAt ?? null,
    admittedParticipantId: params?.admittedParticipantId ?? null,
    createdByUserId: params?.createdByUserId ?? "operator-1",
    createdAt: params?.createdAt ?? now,
    updatedAt: params?.updatedAt ?? now,
  };

  state.intakes.set(intake.id, intake);
  return intake;
}

function snapshot() {
  return {
    intakes: new Map(
      [...state.intakes.entries()].map(([key, value]) => [
        key,
        cloneIntake(value),
      ]),
    ),
    transitions: state.transitions.map(cloneTransition),
    participants: new Map(
      [...state.participants.entries()].map(([key, value]) => [
        key,
        cloneParticipant(value),
      ]),
    ),
    standingTransitions: [...state.standingTransitions],
    docketNextByYear: new Map(state.docketNextByYear),
    transitionCounter: state.transitionCounter,
    participantCounter: state.participantCounter,
    appointmentCreates: state.appointmentCreates,
    authorityCreates: state.authorityCreates,
  };
}

function restore(saved: ReturnType<typeof snapshot>) {
  state.intakes = saved.intakes;
  state.transitions = saved.transitions;
  state.participants = saved.participants;
  state.standingTransitions = saved.standingTransitions;
  state.docketNextByYear = saved.docketNextByYear;
  state.transitionCounter = saved.transitionCounter;
  state.participantCounter = saved.participantCounter;
  state.appointmentCreates = saved.appointmentCreates;
  state.authorityCreates = saved.authorityCreates;
}

const client: any = {
  representativeOnboardingIntake: {
    async findUnique(args: any) {
      if (args.where?.id) {
        return state.intakes.get(args.where.id) ?? null;
      }

      if (args.where?.accessTokenHash) {
        return (
          [...state.intakes.values()].find(
            (item) => item.accessTokenHash === args.where.accessTokenHash,
          ) ?? null
        );
      }

      return null;
    },

    async create(args: any) {
      const data = args.data;
      const intake = seedIntake({
        ...data,
        id: `intake-${state.intakes.size + 1}`,
        submission: data.submission ?? null,
        internalNotes: data.internalNotes ?? null,
        accessRevokedAt: data.accessRevokedAt ?? null,
        submittedAt: data.submittedAt ?? null,
        reviewStartedAt: data.reviewStartedAt ?? null,
        qualifiedAt: data.qualifiedAt ?? null,
        admittedAt: data.admittedAt ?? null,
        admittedParticipantId: data.admittedParticipantId ?? null,
        createdAt: now,
        updatedAt: now,
      });

      const nested = data.transitions?.create;

      if (nested) {
        state.transitionCounter += 1;
        state.transitions.push({
          id: `transition-${state.transitionCounter}`,
          intakeId: intake.id,
          fromStatus: nested.fromStatus ?? null,
          toStatus: nested.toStatus,
          actorUserId: nested.actorUserId ?? null,
          reason: nested.reason ?? null,
          metadata: nested.metadata ?? null,
          occurredAt: nested.occurredAt ?? now,
          createdAt: now,
        });
      }

      return intake;
    },

    async updateMany(args: any) {
      const current = state.intakes.get(args.where.id);

      if (
        !current ||
        (args.where.status !== undefined &&
          current.status !== args.where.status)
      ) {
        return { count: 0 };
      }

      Object.assign(current, args.data, {
        updatedAt: now,
      });

      return { count: 1 };
    },

    async update(args: any) {
      const current = state.intakes.get(args.where.id);

      if (!current) {
        throw new Error("fake intake not found");
      }

      Object.assign(current, args.data, {
        updatedAt: now,
      });

      return current;
    },
  },

  representativeOnboardingTransition: {
    async create(args: any) {
      if (state.failNextOnboardingTransitionCreate) {
        state.failNextOnboardingTransitionCreate = false;
        throw new Error("INJECTED_ONBOARDING_TRANSITION_FAILURE");
      }

      state.transitionCounter += 1;

      const transition: Transition = {
        id: `transition-${state.transitionCounter}`,
        intakeId: args.data.intakeId,
        fromStatus: args.data.fromStatus ?? null,
        toStatus: args.data.toStatus,
        actorUserId: args.data.actorUserId ?? null,
        reason: args.data.reason ?? null,
        metadata: args.data.metadata ?? null,
        occurredAt: args.data.occurredAt ?? now,
        createdAt: now,
      };

      state.transitions.push(transition);
      return transition;
    },
  },

  representativeProgramDocketSequence: {
    async upsert(args: any) {
      const year = args.where.year;
      const existing = state.docketNextByYear.get(year);

      if (existing === undefined) {
        const nextNumber = args.create.nextNumber;
        state.docketNextByYear.set(year, nextNumber);

        return {
          nextNumber,
        };
      }

      const increment = args.update?.nextNumber?.increment ?? 0;

      const nextNumber = existing + increment;
      state.docketNextByYear.set(year, nextNumber);

      return {
        nextNumber,
      };
    },
  },

  representativeProgramParticipant: {
    async create(args: any) {
      state.participantCounter += 1;

      const participant: Participant = {
        id: `participant-${state.participantCounter}`,
        docketReference: args.data.docketReference,
        userId: args.data.userId ?? null,
        displayName: args.data.displayName,
        standing: args.data.standing,
        admittedAt: args.data.admittedAt ?? null,
        createdByUserId: args.data.createdByUserId,
        createdAt: now,
        updatedAt: now,
      };

      state.participants.set(participant.id, participant);

      return participant;
    },

    async findUnique(args: any) {
      return state.participants.get(args.where.id) ?? null;
    },
  },

  representativeProgramStandingTransition: {
    async create(args: any) {
      state.standingTransitions.push({
        ...args.data,
      });

      return {
        id: `standing-${state.standingTransitions.length}`,
        ...args.data,
      };
    },
  },

  representativeProgramAppointment: {
    async create() {
      state.appointmentCreates += 1;
      throw new Error("APPOINTMENT_CREATE_MUST_NOT_BE_CALLED");
    },
  },

  instrumentAuthority: {
    async create() {
      state.authorityCreates += 1;
      throw new Error("AUTHORITY_CREATE_MUST_NOT_BE_CALLED");
    },
  },

  async $transaction(operation: (tx: any) => Promise<any>) {
    const saved = snapshot();

    try {
      return await operation(client);
    } catch (error) {
      restore(saved);
      throw error;
    }
  },
};

async function expectReject(
  label: string,
  operation: () => Promise<unknown>,
  expectedFragment?: string,
) {
  let rejected = false;

  try {
    await operation();
  } catch (error) {
    rejected = true;

    if (expectedFragment && !String(error).includes(expectedFragment)) {
      throw new Error(`${label}: unexpected error: ${String(error)}`);
    }
  }

  assert.equal(rejected, true, `${label}: expected rejection`);
}

async function main() {
  console.log("── lifecycle happy / adversarial path ──");

  seedIntake();

  await submitRepresentativeOnboarding({
    client,
    intakeId: "intake-1",
    submission,
    occurredAt: now,
  });

  assert.equal(
    state.intakes.get("intake-1")?.status,
    REPRESENTATIVE_ONBOARDING_STATUS.SUBMITTED,
  );

  await expectReject(
    "duplicate submit",
    () =>
      submitRepresentativeOnboarding({
        client,
        intakeId: "intake-1",
        submission,
        occurredAt: now,
      }),
    "ARP_ONBOARDING_STATUS_NOOP",
  );

  await beginRepresentativeOnboardingReview({
    client,
    intakeId: "intake-1",
    actorUserId: "operator-1",
    occurredAt: now,
  });

  await returnRepresentativeOnboardingForCompletion({
    client,
    intakeId: "intake-1",
    actorUserId: "operator-1",
    reason: "Need one additional disclosure",
    occurredAt: now,
  });

  assert.equal(
    state.intakes.get("intake-1")?.status,
    REPRESENTATIVE_ONBOARDING_STATUS.RETURNED_FOR_COMPLETION,
  );

  await submitRepresentativeOnboarding({
    client,
    intakeId: "intake-1",
    submission,
    occurredAt: now,
  });

  assert.equal(
    state.intakes.get("intake-1")?.qualificationDecision,
    REPRESENTATIVE_QUALIFICATION_DECISION.PENDING,
  );

  await beginRepresentativeOnboardingReview({
    client,
    intakeId: "intake-1",
    actorUserId: "operator-1",
    occurredAt: now,
  });

  await qualifyRepresentativeOnboarding({
    client,
    intakeId: "intake-1",
    actorUserId: "operator-1",
    internalNotes: "Pilot candidate qualified",
    occurredAt: now,
  });

  assert.equal(
    state.intakes.get("intake-1")?.status,
    REPRESENTATIVE_ONBOARDING_STATUS.QUALIFIED,
  );

  await expectReject(
    "qualified cannot be declined",
    () =>
      declineRepresentativeOnboarding({
        client,
        intakeId: "intake-1",
        actorUserId: "operator-1",
        reason: "invalid late decline",
        occurredAt: now,
      }),
    "ARP_ONBOARDING_STATUS_TRANSITION_INVALID",
  );

  console.log("✓ lifecycle transitions enforced");
  console.log("✓ return → resubmit supported");
  console.log("✓ terminal/invalid edge rejected");

  console.log();
  console.log("── ordinary lifecycle atomic rollback ──");

  seedIntake({
    id: "atomic-intake",
    reference: "FWI-26-RP-ONB-ATOMIC01",
  });

  const transitionsBeforeAtomic = state.transitions.length;

  state.failNextOnboardingTransitionCreate = true;

  await expectReject(
    "submit transition-history failure",
    () =>
      submitRepresentativeOnboarding({
        client,
        intakeId: "atomic-intake",
        submission,
        occurredAt: now,
      }),
    "INJECTED_ONBOARDING_TRANSITION_FAILURE",
  );

  assert.equal(
    state.intakes.get("atomic-intake")?.status,
    REPRESENTATIVE_ONBOARDING_STATUS.DRAFT,
  );

  assert.equal(state.transitions.length, transitionsBeforeAtomic);

  console.log("✓ status mutation rolled back with history failure");
  console.log("✓ application-facing submit is atomic");

  console.log();
  console.log("── private access semantics ──");

  const rawToken = "pilot-secret-token";
  const hash = hashRepresentativeOnboardingAccessToken(rawToken);

  seedIntake({
    id: "access-live",
    reference: "FWI-26-RP-ONB-ACCESS01",
    accessTokenHash: hash,
    accessIssuedAt: new Date("2026-09-21T10:00:00.000Z"),
    accessExpiresAt: new Date("2026-09-22T10:00:00.000Z"),
  });

  const accessible = await resolveRepresentativeOnboardingAccessWithClient({
    client,
    rawAccessToken: rawToken,
    at: new Date("2026-09-21T12:00:00.000Z"),
  });

  assert.equal(accessible.accessible, true);
  assert.equal(
    accessible.reason,
    REPRESENTATIVE_ONBOARDING_ACCESS_REASON.ACCESSIBLE,
  );

  state.intakes.get("access-live")!.accessRevokedAt = new Date(
    "2026-09-21T12:30:00.000Z",
  );

  const revoked = await resolveRepresentativeOnboardingAccessWithClient({
    client,
    rawAccessToken: rawToken,
    at: new Date("2026-09-21T13:00:00.000Z"),
  });

  assert.equal(revoked.accessible, false);
  assert.equal(revoked.reason, REPRESENTATIVE_ONBOARDING_ACCESS_REASON.REVOKED);

  state.intakes.delete("access-live");

  seedIntake({
    id: "access-expired",
    reference: "FWI-26-RP-ONB-ACCESS02",
    accessTokenHash: hash,
    accessIssuedAt: new Date("2026-09-20T10:00:00.000Z"),
    accessExpiresAt: new Date("2026-09-21T10:00:00.000Z"),
  });

  const expired = await resolveRepresentativeOnboardingAccessWithClient({
    client,
    rawAccessToken: rawToken,
    at: new Date("2026-09-21T12:00:00.000Z"),
  });

  assert.equal(expired.accessible, false);
  assert.equal(expired.reason, REPRESENTATIVE_ONBOARDING_ACCESS_REASON.EXPIRED);

  console.log("✓ valid token resolves");
  console.log("✓ revoked token rejected");
  console.log("✓ expired token rejected");

  console.log();
  console.log("── admission rollback / docket integrity ──");

  const qualified = state.intakes.get("intake-1");

  assert.ok(qualified);
  assert.equal(qualified.status, REPRESENTATIVE_ONBOARDING_STATUS.QUALIFIED);

  const docketBefore = state.docketNextByYear.get(2026);

  const participantsBefore = state.participants.size;

  state.failNextOnboardingTransitionCreate = true;

  await expectReject(
    "admission transition-history failure",
    () =>
      admitRepresentativeOnboarding({
        client,
        intakeId: "intake-1",
        actorUserId: "operator-1",
        occurredAt: now,
      }),
    "INJECTED_ONBOARDING_TRANSITION_FAILURE",
  );

  assert.equal(
    state.intakes.get("intake-1")?.status,
    REPRESENTATIVE_ONBOARDING_STATUS.QUALIFIED,
  );

  assert.equal(state.intakes.get("intake-1")?.admittedParticipantId, null);

  assert.equal(state.participants.size, participantsBefore);

  assert.equal(state.docketNextByYear.get(2026), docketBefore);

  console.log("✓ failed admission rolled back Participant");
  console.log("✓ failed admission rolled back docket allocation");
  console.log("✓ failed admission left intake QUALIFIED");

  console.log();
  console.log("── successful admission / idempotency ──");

  const admitted = await admitRepresentativeOnboarding({
    client,
    intakeId: "intake-1",
    actorUserId: "operator-1",
    occurredAt: now,
  });

  assert.equal(admitted.created, true);
  assert.equal(admitted.participant.standing, "PROVISIONAL");
  assert.equal(admitted.participant.docketReference, "FWI-26-RP-001");

  assert.equal(
    state.intakes.get("intake-1")?.status,
    REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED,
  );

  assert.equal(
    state.intakes.get("intake-1")?.admittedParticipantId,
    admitted.participant.id,
  );

  const docketAfterFirstAdmission = state.docketNextByYear.get(2026);

  const participantCountAfterFirstAdmission = state.participants.size;

  const admittedAgain = await admitRepresentativeOnboarding({
    client,
    intakeId: "intake-1",
    actorUserId: "operator-1",
    occurredAt: now,
  });

  assert.equal(admittedAgain.created, false);
  assert.equal(admittedAgain.participant.id, admitted.participant.id);

  assert.equal(state.participants.size, participantCountAfterFirstAdmission);

  assert.equal(state.docketNextByYear.get(2026), docketAfterFirstAdmission);

  assert.equal(state.appointmentCreates, 0);
  assert.equal(state.authorityCreates, 0);

  console.log("✓ admission creates PROVISIONAL participant");
  console.log("✓ first docket = FWI-26-RP-001");
  console.log("✓ repeated admission is idempotent");
  console.log("✓ repeated admission consumes no second docket");
  console.log("✓ admission creates no Appointment");
  console.log("✓ admission grants no authority");

  console.log();
  console.log("════════════════════════════════════════════════════");
  console.log(" REPRESENTATIVE ONBOARDING ADVERSARIAL SMOKE PASSED");
  console.log("════════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
