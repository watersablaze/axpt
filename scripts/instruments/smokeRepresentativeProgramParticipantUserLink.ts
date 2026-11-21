import assert from "node:assert/strict";

import {
  linkRepresentativeProgramParticipantUserWithClient,
} from "../../src/domains/instruments/representative-program/commands/linkRepresentativeProgramParticipantUserWithClient";

type State = {
  participant: {
    id: string;
    docketReference: string;
    userId: string | null;
    onboardingIntake: {
      status: string;
      admittedParticipantId: string | null;
      candidateEmail: string;
    } | null;
  };
  user: {
    id: string;
    email: string;
  };
  competingParticipant:
    | {
        id: string;
        userId: string;
      }
    | null;
  events: any[];
};

function fixture(): {
  state: State;
  client: any;
} {
  const state: State = {
    participant: {
      id: "participant-1",
      docketReference:
        "FWI-26-RP-001",
      userId: null,
      onboardingIntake: {
        status: "ADMITTED",
        admittedParticipantId:
          "participant-1",
        candidateEmail:
          "jens@example.test",
      },
    },
    user: {
      id: "user-1",
      email:
        "JENS@example.test",
    },
    competingParticipant:
      null,
    events: [],
  };

  const client = {
    user: {
      findUnique: async ({
        where,
      }: any) =>
        where.id === state.user.id
          ? state.user
          : null,
    },

    representativeProgramParticipant: {
      findUnique: async ({
        where,
      }: any) => {
        if (
          where.id ===
          state.participant.id
        ) {
          return state.participant;
        }

        if (
          where.userId
        ) {
          if (
            state.participant.userId ===
            where.userId
          ) {
            return {
              id:
                state.participant.id,
            };
          }

          const competingParticipant =
            state.competingParticipant;

          if (
            competingParticipant &&
            competingParticipant.userId ===
              where.userId
          ) {
            return {
              id:
                competingParticipant.id,
            };
          }
        }

        return null;
      },

      updateMany: async ({
        where,
        data,
      }: any) => {
        if (
          state.participant.id !==
            where.id ||
          state.participant.userId !==
            where.userId
        ) {
          return {
            count: 0,
          };
        }

        state.participant.userId =
          data.userId;

        return {
          count: 1,
        };
      },
    },

    domainEvent: {
      create: async ({
        data,
      }: any) => {
        state.events.push(data);
        return data;
      },
    },
  };

  return {
    state,
    client,
  };
}

async function mustReject(
  setup:
    ReturnType<typeof fixture>,
  expected:
    string,
) {
  await assert.rejects(
    () =>
      linkRepresentativeProgramParticipantUserWithClient({
        client:
          setup.client,
        participantId:
          "participant-1",
        userId:
          "user-1",
        actorUserId:
          "operator-1",
        occurredAt:
          new Date(
            "2026-10-03T17:00:00.000Z",
          ),
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes(
        expected,
      ),
  );
}

async function main() {
  const valid =
    fixture();

  const first =
    await linkRepresentativeProgramParticipantUserWithClient({
      client:
        valid.client,
      participantId:
        "participant-1",
      userId:
        "user-1",
      actorUserId:
        "operator-1",
      occurredAt:
        new Date(
          "2026-10-03T17:00:00.000Z",
        ),
    });

  assert.equal(
    first.linked,
    true,
  );

  assert.equal(
    valid.state.participant.userId,
    "user-1",
  );

  assert.equal(
    valid.state.events.length,
    1,
  );

  assert.equal(
    valid.state.events[0].eventType,
    "REPRESENTATIVE_PARTICIPANT_USER_LINKED",
  );

  const replay =
    await linkRepresentativeProgramParticipantUserWithClient({
      client:
        valid.client,
      participantId:
        "participant-1",
      userId:
        "user-1",
      actorUserId:
        "operator-1",
    });

  assert.equal(
    replay.linked,
    false,
  );

  assert.equal(
    valid.state.events.length,
    1,
  );

  const emailMismatch =
    fixture();

  emailMismatch.state.user.email =
    "other@example.test";

  await mustReject(
    emailMismatch,
    "EMAIL_MISMATCH",
  );

  const unadmitted =
    fixture();

  unadmitted.state.participant
    .onboardingIntake!.status =
    "QUALIFIED";

  await mustReject(
    unadmitted,
    "ADMISSION_REQUIRED",
  );

  const reassignment =
    fixture();

  reassignment.state.participant.userId =
    "different-user";

  await mustReject(
    reassignment,
    "REASSIGNMENT_FORBIDDEN",
  );

  const alreadyLinked =
    fixture();

  alreadyLinked.state.competingParticipant = {
    id:
      "participant-2",
    userId:
      "user-1",
  };

  await mustReject(
    alreadyLinked,
    "USER_ALREADY_LINKED",
  );

  console.log(
    "REP_1B_1_PARTICIPANT_USER_LINK_OK",
  );
}

main().catch(
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
