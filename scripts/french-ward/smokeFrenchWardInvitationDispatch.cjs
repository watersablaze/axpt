"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const crypto = require("node:crypto");

const esbuild = require(process.env.ESBUILD_MAIN);

async function loadDispatch() {
  const filename = path.resolve(
    "src/domains/institutions/french-ward/participants/" +
    "invitations/dispatchFrenchWardInstitutionalInvitationWithClient.ts"
  );

  const build = await esbuild.build({
    entryPoints: [filename],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "server-only-test-stub",
      setup(build) {
        build.onResolve(
          { filter: /^server-only$/ },
          () => ({ path: "stub", namespace: "test" })
        );
        build.onLoad(
          { filter: /.*/, namespace: "test" },
          () => ({ contents: "", loader: "js" })
        );
      }
    }]
  });

  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(build.outputFiles[0].text, filename);

  return mod.exports
    .dispatchFrenchWardInstitutionalInvitationWithClient;
}

function fixture() {
  const credential = "A".repeat(43);

  const invitation = {
    id: "inv-1",
    reference: "FW-TEST-INV-1",
    recipientEmail: "recipient@example.test",
    recipientDisplayName: "Test Recipient",
    institutionalTitle: "Proposed Institutional Participant",
    secondaryTitle: null,
    capacityClass: "STRATEGIC",
    issuedByUserId: "issuer-1",
    credentialHash: crypto.createHash("sha256")
      .update(credential).digest("hex"),
    acceptedAt: null,
    revokedAt: null,
    expiresAt: new Date("2026-12-12T18:00:00Z")
  };

  let durable = {
    claim: {
      id: "claim-1",
      invitationId: "inv-1",
      deliveryKey: "FW_INV_DELIVERY_TEST_00001",
      issuerUserId: "issuer-1",
      recipientEmail: "recipient@example.test",
      status: "SENDING",
      providerMessageId: null,
      providerErrorCode: null
    },
    events: [],
    emailLogs: []
  };

  let failFinalization = false;
  let beforeClaim = null;

  const client = {
    frenchWardInstitutionalInvitation: {
      findUnique: async () => invitation
    },

    frenchWardInstitutionalInvitationDelivery: {
      findUnique: async () => structuredClone(durable.claim)
    },

    async $transaction(callback) {
      if (beforeClaim) {
        const change = beforeClaim;
        beforeClaim = null;
        change();
      }

      const draft = structuredClone(durable);

      const tx = {
        $queryRaw: async () => [{ id: invitation.id }],
        user: {
          findUnique: async () => ({
            id: "issuer-1",
            isAdmin: true
          })
        },
        frenchWardInstitutionalInvitation: {
          findUnique: async () => structuredClone(invitation)
        },
        frenchWardInstitutionalInvitationDelivery: {
          findUnique: async () => structuredClone(draft.claim),
          async updateMany({ where, data }) {
            if (
              draft.claim.id !== where.id ||
              draft.claim.status !== where.status
            ) {
              return { count: 0 };
            }

            if (
              failFinalization &&
              where.status === "DISPATCHING"
            ) {
              throw new Error("SIMULATED_FINALIZATION_FAILURE");
            }

            Object.assign(draft.claim, data);
            return { count: 1 };
          }
        },

        domainEvent: {
          async create({ data }) {
            draft.events.push(data);
          }
        },

        emailLog: {
          async create({ data }) {
            draft.emailLogs.push(data);
          }
        }
      };

      const result = await callback(tx);
      durable = draft;

      return result;
    }
  };

  return {
    invitation,
    args: {
      client,
      invitationId: "inv-1",
      actorUserId: "issuer-1",
      deliveryKey: durable.claim.deliveryKey,
      credential,
      from: "French-Ward <french-ward@axpt.io>",
      now: new Date("2026-11-12T18:00:00Z")
    },
    state: () => structuredClone(durable),
    failFinalization: () => {
      failFinalization = true;
    },
    beforeClaim: callback => {
      beforeClaim = callback;
    }
  };
}

async function main() {
  const dispatch = await loadDispatch();

  // Concurrent requests must produce exactly one provider call.
  {
    const f = fixture();
    let sends = 0;
    let release;
    let started;

    const providerGate = new Promise(resolve => {
      release = resolve;
    });

    const providerStarted = new Promise(resolve => {
      started = resolve;
    });

    const send = async mail => {
      sends++;
      assert.equal(mail.to, "recipient@example.test");
      assert.ok(mail.text.includes(f.args.credential));
      started();

      await providerGate;

      return {
        data: { id: "provider-1" },
        error: null
      };
    };

    const first = dispatch({ ...f.args, send });

    await providerStarted;

    await assert.rejects(
      dispatch({ ...f.args, send }),
      /DISPATCH_UNAVAILABLE/
    );

    assert.equal(sends, 1);

    release();

    const result = await first;

    assert.equal(result.status, "PROVIDER_ACCEPTED");
    assert.equal(result.providerMessageId, "provider-1");

    const state = f.state();

    assert.equal(state.claim.status, "PROVIDER_ACCEPTED");
    assert.equal(state.events.length, 2);
    assert.equal(state.emailLogs.length, 1);

    const durableText = JSON.stringify(state);

    assert.ok(!durableText.includes(f.args.credential));
    assert.ok(!durableText.includes(
      "/french-ward/institutional/access/"
    ));

    console.log("concurrent_single_dispatch=PASS");
    console.log("provider_receipt_durable=PASS");
    console.log("credential_excluded_from_evidence=PASS");
  }

  // Explicit provider rejection.
  {
    const f = fixture();

    const result = await dispatch({
      ...f.args,
      send: async () => ({
        data: null,
        error: { message: "rejected" }
      })
    });

    assert.equal(result.status, "FAILED");
    assert.equal(f.state().claim.status, "FAILED");

    console.log("provider_rejection=PASS");
  }

  // Provider returned no usable conclusion.
  {
    const f = fixture();

    const result = await dispatch({
      ...f.args,
      send: async () => ({
        data: null,
        error: null
      })
    });

    assert.equal(result.status, "DELIVERY_UNKNOWN");

    console.log("ambiguous_provider_response=PASS");
  }

  // Provider transport exception.
  {
    const f = fixture();

    const result = await dispatch({
      ...f.args,
      send: async () => {
        throw new Error("SIMULATED_TRANSPORT_FAILURE");
      }
    });

    assert.equal(result.status, "DELIVERY_UNKNOWN");

    console.log("provider_exception=PASS");
  }

  // Provider may have accepted, but DB finalization fails.
  {
    const f = fixture();
    f.failFinalization();

    await assert.rejects(
      dispatch({
        ...f.args,
        send: async () => ({
          data: { id: "provider-2" },
          error: null
        })
      }),
      /SIMULATED_FINALIZATION_FAILURE/
    );

    assert.equal(f.state().claim.status, "DISPATCHING");

    await assert.rejects(
      dispatch({
        ...f.args,
        send: async () => {
          throw new Error("MUST_NOT_REPEAT");
        }
      }),
      /DISPATCH_UNAVAILABLE/
    );

    console.log("interrupted_finalization_fail_closed=PASS");
  }

  // Already-revoked invitation must not reach provider.
  {
    const f = fixture();
    f.invitation.revokedAt = new Date();

    let sends = 0;

    await assert.rejects(
      dispatch({
        ...f.args,
        send: async () => {
          sends++;
          return {};
        }
      }),
      /DISPATCH_UNAVAILABLE/
    );

    assert.equal(sends, 0);

    console.log("preexisting_revocation_blocks_dispatch=PASS");
  }

  // Acceptance between preliminary read and dispatch claim.
  {
    const f = fixture();
    let sends = 0;

    f.beforeClaim(() => {
      f.invitation.acceptedAt = new Date();
    });

    await assert.rejects(
      dispatch({
        ...f.args,
        send: async () => {
          sends++;
          return {};
        }
      }),
      /DISPATCH_UNAVAILABLE/
    );

    assert.equal(sends, 0);
    assert.equal(f.state().claim.status, "SENDING");
    console.log("acceptance_before_claim_blocks_dispatch=PASS");
  }

  // Revocation between preliminary read and dispatch claim.
  {
    const f = fixture();
    let sends = 0;

    f.beforeClaim(() => {
      f.invitation.revokedAt = new Date();
    });

    await assert.rejects(
      dispatch({
        ...f.args,
        send: async () => {
          sends++;
          return {};
        }
      }),
      /DISPATCH_UNAVAILABLE/
    );

    assert.equal(sends, 0);
    assert.equal(f.state().claim.status, "SENDING");
    console.log("revocation_before_claim_blocks_dispatch=PASS");
  }

  console.log("REAL_PROVIDER_CALLS=NONE");
  console.log("REAL_DATABASE_MUTATIONS=NONE");
  console.log("DISPATCH_RUNTIME_SMOKE=PASS");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
