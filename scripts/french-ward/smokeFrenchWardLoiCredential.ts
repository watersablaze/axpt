import assert from "node:assert/strict";

import {
  FRENCH_WARD_LOI_ACCESS_COOKIE,
  FRENCH_WARD_LOI_ACCESS_PATH,
  generateFrenchWardLoiCredential,
  hashFrenchWardLoiCredential,
} from "@/domains/institutions/french-ward/commercial/loiInvitationCredential";

import {
  resolveFrenchWardLoiCredentialWithClient,
} from "@/domains/institutions/french-ward/commercial/resolveFrenchWardLoiCredentialWithClient";

const NOW =
  new Date(
    "2026-11-05T00:00:00.000Z",
  );

function fixture() {
  const raw =
    generateFrenchWardLoiCredential();

  const invitation = {
    id:
      "invitation-001",

    credentialHash:
      hashFrenchWardLoiCredential(
        raw,
      ),

    credentialIssuedAt:
      NOW,

    grantId:
      "grant-001",

    recipientUserId:
      "recipient-001",

    recipientEmail:
      "recipient@example.test",

    recipientName:
      "Example Recipient",

    policy:
      "FRENCH_WARD_GOVERNING_LOI_ACCESS_V1",

    expiresAt:
      new Date(
        NOW.getTime() +
        86400000,
      ),

    revokedAt:
      null,
  };

  const grant = {
    id:
      "grant-001",

    requestId:
      "request-001",

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

    issuedAt:
      new Date(
        NOW.getTime() -
        1000,
      ),

    expiresAt:
      new Date(
        NOW.getTime() +
        86400000,
      ),

    revokedAt:
      null,
  };

  const client: any = {
    frenchWardLoiInvitation: {
      async findUnique(
        args: any,
      ) {
        if (
          args.where
            .credentialHash !==
          invitation
            .credentialHash
        ) {
          return null;
        }

        return {
          ...invitation,
        };
      },
    },

    institutionalAccessGrant: {
      async findFirst(
        args: any,
      ) {
        if (
          args.where.id !==
          grant.id
        ) {
          return null;
        }

        if (
          args.where
            .recipientUserId !==
          grant.recipientUserId
        ) {
          return null;
        }

        if (
          args.where
            .recipientEmail !==
          grant.recipientEmail
        ) {
          return null;
        }

        return {
          id:
            grant.id,

          requestId:
            grant.requestId,

          recipientUserId:
            grant.recipientUserId,

          scope:
            grant.scope,

          resourceReference:
            grant
              .resourceReference,

          resourceVersion:
            grant
              .resourceVersion,

          expiresAt:
            grant.expiresAt,
        };
      },
    },
  };

  return {
    raw,
    invitation,
    grant,
    client,
  };
}

async function main() {
  {
    assert.equal(
      FRENCH_WARD_LOI_ACCESS_COOKIE,
      "fw_loi_access",
    );

    assert.equal(
      FRENCH_WARD_LOI_ACCESS_PATH,
      "/french-ward/transaction-intake",
    );

    console.log(
      "✓ credential cookie is scoped to canonical French-Ward intake path",
    );
  }

  {
    const {
      raw,
    } =
      fixture();

    assert.ok(
      raw.length >= 40,
    );

    assert.match(
      hashFrenchWardLoiCredential(
        raw,
      ),
      /^[0-9a-f]{64}$/,
    );

    assert.notEqual(
      raw,
      hashFrenchWardLoiCredential(
        raw,
      ),
    );

    console.log(
      "✓ credential is high entropy and only hashes to persistence shape",
    );
  }

  {
    const {
      raw,
      client,
    } =
      fixture();

    const resolved =
      await resolveFrenchWardLoiCredentialWithClient({
        client,
        credential:
          raw,
        action:
          "VIEW_FORM",
        now:
          NOW,
      });

    assert.equal(
      resolved.allowed,
      true,
    );

    if (!resolved.allowed) {
      throw new Error(
        "expected credential access",
      );
    }

    assert.equal(
      resolved.grantId,
      "grant-001",
    );

    assert.deepEqual(
      resolved.identity,
      {
        userId:
          "recipient-001",

        email:
          "recipient@example.test",
      },
    );

    console.log(
      "✓ credential reconstructs exact recipient identity + exact grant",
    );
  }

  {
    const {
      client,
    } =
      fixture();

    const resolved =
      await resolveFrenchWardLoiCredentialWithClient({
        client,
        credential:
          "invalid-credential",
        action:
          "VIEW_FORM",
        now:
          NOW,
      });

    assert.equal(
      resolved.allowed,
      false,
    );

    console.log(
      "✓ invalid credential fails closed",
    );
  }

  {
    const {
      raw,
      invitation,
      client,
    } =
      fixture();

    invitation.revokedAt =
      NOW;

    const resolved =
      await resolveFrenchWardLoiCredentialWithClient({
        client,
        credential:
          raw,
        action:
          "VIEW_FORM",
        now:
          NOW,
      });

    assert.equal(
      resolved.allowed,
      false,
    );

    console.log(
      "✓ revoked invitation kills credential",
    );
  }

  {
    const {
      raw,
      invitation,
      client,
    } =
      fixture();

    invitation.expiresAt =
      new Date(
        NOW.getTime() -
        1,
      );

    const resolved =
      await resolveFrenchWardLoiCredentialWithClient({
        client,
        credential:
          raw,
        action:
          "VIEW_FORM",
        now:
          NOW,
      });

    assert.equal(
      resolved.allowed,
      false,
    );

    console.log(
      "✓ expired invitation kills credential",
    );
  }

  {
    const {
      raw,
      grant,
      client,
    } =
      fixture();

    grant.id =
      "different-grant";

    const resolved =
      await resolveFrenchWardLoiCredentialWithClient({
        client,
        credential:
          raw,
        action:
          "SUBMIT_INTAKE",
        now:
          NOW,
      });

    assert.equal(
      resolved.allowed,
      false,
    );

    console.log(
      "✓ credential cannot float to another recipient grant",
    );
  }

  console.log(
    "✓ FW-ACTIONS-1E.2 PUBLIC CREDENTIAL FOUNDATION PASSED",
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
