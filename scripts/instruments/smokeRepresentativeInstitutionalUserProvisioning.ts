import assert from "node:assert/strict";

import {
  resolveRepresentativeInstitutionalUserWithClient,
} from "../../src/domains/instruments/representative-program/onboarding/commands/resolveRepresentativeInstitutionalUserWithClient";

type User = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
  tier: string | null;
  passwordHash?: string;
};

function fixture() {
  const state = {
    intake: {
      id:
        "intake-1",
      status:
        "QUALIFIED",
      candidateEmail:
        "Jens@Example.Test",
      candidateDisplayName:
        "Jens Peter Thomsen",
    },
    users:
      [] as User[],
  };

  const client = {
    representativeOnboardingIntake: {
      findUnique:
        async ({
          where,
        }: any) =>
          where.id ===
            state.intake.id
            ? state.intake
            : null,
    },

    user: {
      findMany:
        async ({
          where,
          take,
        }: any) => {
          const target =
            String(
              where.email.equals,
            ).toLowerCase();

          return state.users
            .filter(
              (user) =>
                user.email
                  .toLowerCase() ===
                target,
            )
            .slice(
              0,
              take,
            )
            .map(
              ({
                passwordHash: _,
                ...user
              }) =>
                user,
            );
        },

      create:
        async ({
          data,
        }: any) => {
          const user: User = {
            id:
              `user-${state.users.length + 1}`,
            email:
              data.email,
            username:
              data.username,
            displayName:
              data.displayName,
            isAdmin:
              data.isAdmin,
            tier:
              data.tier,
            passwordHash:
              data.passwordHash,
          };

          state.users.push(
            user,
          );

          const {
            passwordHash: _,
            ...publicUser
          } = user;

          return publicUser;
        },
    },
  };

  return {
    state,
    client,
  };
}

async function main() {
  const fresh =
    fixture();

  const created =
    await resolveRepresentativeInstitutionalUserWithClient({
      client:
        fresh.client as any,
      intakeId:
        "intake-1",
    });

  assert.equal(
    created.created,
    true,
  );

  assert.equal(
    created.user.email,
    "jens@example.test",
  );

  assert.equal(
    created.user.displayName,
    "Jens Peter Thomsen",
  );

  assert.equal(
    created.user.isAdmin,
    false,
  );

  assert.equal(
    created.user.tier,
    "representative",
  );

  assert.match(
    fresh.state.users[0]
      .passwordHash ?? "",
    /^\$2[aby]\$/,
  );

  assert.match(
    created.user.username,
    /^arp-[a-f0-9]{32}$/,
  );

  const replay =
    await resolveRepresentativeInstitutionalUserWithClient({
      client:
        fresh.client as any,
      intakeId:
        "intake-1",
    });

  assert.equal(
    replay.created,
    false,
  );

  assert.equal(
    replay.user.id,
    created.user.id,
  );

  assert.equal(
    fresh.state.users.length,
    1,
  );

  const existing =
    fixture();

  existing.state.users.push({
    id:
      "existing-user",
    email:
      "jEnS@example.test",
    username:
      "existing",
    displayName:
      "Existing Identity",
    isAdmin:
      false,
    tier:
      null,
  });

  const resolved =
    await resolveRepresentativeInstitutionalUserWithClient({
      client:
        existing.client as any,
      intakeId:
        "intake-1",
    });

  assert.equal(
    resolved.created,
    false,
  );

  assert.equal(
    resolved.user.id,
    "existing-user",
  );

  const ambiguous =
    fixture();

  ambiguous.state.users.push(
    {
      id:
        "case-a",
      email:
        "jens@example.test",
      username:
        "case-a",
      displayName:
        null,
      isAdmin:
        false,
      tier:
        null,
    },
    {
      id:
        "case-b",
      email:
        "JENS@example.test",
      username:
        "case-b",
      displayName:
        null,
      isAdmin:
        false,
      tier:
        null,
    },
  );

  await assert.rejects(
    () =>
      resolveRepresentativeInstitutionalUserWithClient({
        client:
          ambiguous.client as any,
        intakeId:
          "intake-1",
      }),
    /EMAIL_IDENTITY_CONTRADICTION/,
  );

  const premature =
    fixture();

  premature.state.intake.status =
    "SUBMITTED";

  await assert.rejects(
    () =>
      resolveRepresentativeInstitutionalUserWithClient({
        client:
          premature.client as any,
        intakeId:
          "intake-1",
      }),
    /ADMISSION_BOUNDARY_REQUIRED/,
  );

  console.log(
    "REP_1B_2_REPRESENTATIVE_USER_PROVISIONING_OK",
  );
}

main().catch(
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
