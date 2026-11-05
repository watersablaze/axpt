import assert from "node:assert/strict";

import {
  generateFrenchWardLoiCredential,
  hashFrenchWardLoiCredential,
} from "@/domains/institutions/french-ward/commercial/loiInvitationCredential";

import {
  resolveFrenchWardCommercialIntakeRequestAccessWithClient,
} from "@/domains/institutions/french-ward/commercial/resolveFrenchWardCommercialIntakeRequestAccessWithClient";

const NOW =
  new Date(
    "2026-11-05T00:00:00.000Z",
  );

function fixture() {
  const credential =
    generateFrenchWardLoiCredential();

  const invitation = {
    id:
      "inv-001",

    credentialHash:
      hashFrenchWardLoiCredential(
        credential,
      ),

    credentialIssuedAt:
      NOW,

    grantId:
      "grant-invitation",

    recipientUserId:
      "recipient-001",

    recipientEmail:
      "recipient@example.test",

    recipientName:
      "Recipient One",

    policy:
      "FRENCH_WARD_GOVERNING_LOI_ACCESS_V1",

    expiresAt:
      new Date(
        NOW.getTime() +
        86_400_000,
      ),

    revokedAt:
      null,
  };

  const grants = [
    {
      id:
        "grant-principal",

      requestId:
        "request-principal",

      recipientUserId:
        "principal-001",

      recipientEmail:
        "principal@example.test",

      scope:
        "LOI_INTAKE_ACCESS",

      resourceReference:
        "french-ward:commercial-intake:v1",

      resourceVersion:
        1,

      expiresAt:
        new Date(
          NOW.getTime() +
          86_400_000,
        ),
    },

    {
      id:
        "grant-invitation",

      requestId:
        "request-invitation",

      recipientUserId:
        "recipient-001",

      recipientEmail:
        "recipient@example.test",

      scope:
        "LOI_INTAKE_ACCESS",

      resourceReference:
        "french-ward:commercial-intake:v1",

      resourceVersion:
        1,

      expiresAt:
        new Date(
          NOW.getTime() +
          86_400_000,
        ),
    },
  ];

  const client: any = {
    institutionalAccessGrant: {
      async findFirst(
        args: any,
      ) {
        const where =
          args.where;

        const match =
          grants.find(
            grant =>
              (
                !where.id ||
                where.id === grant.id
              ) &&
              where.recipientUserId ===
                grant.recipientUserId &&
              where.recipientEmail ===
                grant.recipientEmail &&
              where.scope ===
                grant.scope &&
              where.resourceReference ===
                grant.resourceReference &&
              where.resourceVersion ===
                grant.resourceVersion,
          );

        return match
          ? {
              ...match,
            }
          : null;
      },
    },

    frenchWardLoiInvitation: {
      async findUnique(
        args: any,
      ) {
        return (
          args.where
            .credentialHash ===
          invitation
            .credentialHash
        )
          ? {
              ...invitation,
            }
          : null;
      },
    },
  };

  return {
    client,
    credential,
    invitation,
    grants,
  };
}

async function main() {
  {
    const {
      client,
    } =
      fixture();

    const access =
      await resolveFrenchWardCommercialIntakeRequestAccessWithClient({
        client,

        principal: {
          userId:
            "principal-001",

          email:
            "principal@example.test",

          displayName:
            "Authenticated Principal",
        },

        credential:
          null,

        action:
          "VIEW_FORM",

        now:
          NOW,
      });

    assert.equal(
      access.allowed,
      true,
    );

    if (!access.allowed) {
      throw new Error(
        "expected principal access",
      );
    }

    assert.equal(
      access.source,
      "AUTHENTICATED_PRINCIPAL",
    );

    assert.equal(
      access.grantId,
      "grant-principal",
    );

    console.log(
      "✓ authenticated principal retains existing intake access path",
    );
  }

  {
    const {
      client,
      credential,
    } =
      fixture();

    const access =
      await resolveFrenchWardCommercialIntakeRequestAccessWithClient({
        client,

        principal:
          null,

        credential,

        action:
          "VIEW_FORM",

        now:
          NOW,
      });

    assert.equal(
      access.allowed,
      true,
    );

    if (!access.allowed) {
      throw new Error(
        "expected invitation access",
      );
    }

    assert.equal(
      access.source,
      "GOVERNING_LOI_CREDENTIAL",
    );

    assert.equal(
      access.grantId,
      "grant-invitation",
    );

    assert.equal(
      access.displayName,
      "Recipient One",
    );

    console.log(
      "✓ verified invitation cookie opens intake without AXPT sign-in",
    );
  }

  {
    const {
      client,
      credential,
    } =
      fixture();

    const access =
      await resolveFrenchWardCommercialIntakeRequestAccessWithClient({
        client,

        /*
         * An unrelated authenticated AXPT identity must not suppress
         * a separately valid recipient invitation.
         */
        principal: {
          userId:
            "unrelated-user",

          email:
            "unrelated@example.test",

          displayName:
            "Unrelated User",
        },

        credential,

        action:
          "VIEW_FORM",

        now:
          NOW,
      });

    assert.equal(
      access.allowed,
      true,
    );

    if (!access.allowed) {
      throw new Error(
        "expected invitation fallback",
      );
    }

    assert.equal(
      access.source,
      "GOVERNING_LOI_CREDENTIAL",
    );

    assert.equal(
      access.identity.userId,
      "recipient-001",
    );

    console.log(
      "✓ unrelated logged-in identity cannot suppress valid invitation access",
    );
  }

  {
    const {
      client,
    } =
      fixture();

    const access =
      await resolveFrenchWardCommercialIntakeRequestAccessWithClient({
        client,

        principal:
          null,

        credential:
          "invalid",

        action:
          "VIEW_FORM",

        now:
          NOW,
      });

    assert.equal(
      access.allowed,
      false,
    );

    console.log(
      "✓ invalid invitation cookie fails closed",
    );
  }

  {
    const {
      client,
      credential,
      invitation,
    } =
      fixture();

    invitation.revokedAt =
      NOW;

    const access =
      await resolveFrenchWardCommercialIntakeRequestAccessWithClient({
        client,

        principal:
          null,

        credential,

        action:
          "VIEW_FORM",

        now:
          NOW,
      });

    assert.equal(
      access.allowed,
      false,
    );

    console.log(
      "✓ revoked invitation immediately loses page access",
    );
  }

  console.log(
    "✓ FW-ACTIONS-1E.5B REQUEST ACCESS CONTRACT PASSED",
  );
}

main().catch(
  error => {
    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);
