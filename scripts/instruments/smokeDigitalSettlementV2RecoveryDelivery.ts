import assert from "node:assert/strict";

import {
  buildDigitalSettlementV2RecoveryDelivery,
} from "../../src/domains/instruments/communications/digitalSettlementV2RecoveryDelivery";

async function main() {
  const delivery =
    buildDigitalSettlementV2RecoveryDelivery({
      origin: "https://www.axpt.io",
      recovery: {
        key: "financier",
        recipientName:
          "Carl Albert Meisterlin",
        email:
          "meisterlin@aol.com",
        replacedGrantId:
          "grant-old",
        grant: {
          id:
            "grant-replacement",
          instrumentVersionId:
            "version-2",
          recipientName:
            "Carl Albert Meisterlin",
          accessLevel:
            "VIEW",
          expiresAt:
            new Date(
              Date.now() +
                7 * 24 * 60 * 60 * 1000,
            ),
        },
        token:
          "replacement-secret-token",
        instrumentVersion: {
          id:
            "version-2",
          number:
            2,
          status:
            "ISSUED",
        },
      },
    });

  assert.equal(
    delivery.recipientKey,
    "financier",
  );

  assert.equal(
    delivery.grantId,
    "grant-replacement",
  );

  assert.equal(
    delivery.replacedGrantId,
    "grant-old",
  );

  assert.equal(
    delivery.deliveryKey,
    "DSI_V2_2_grant-replacement_financier",
  );

  assert.equal(
    delivery.input.to,
    "meisterlin@aol.com",
  );

  assert.match(
    delivery.input.html,
    /replacement-secret-token/,
  );

  assert.match(
    delivery.input.text,
    /50 USDT/,
  );

  const durable =
    JSON.stringify(
      delivery.input.rawPayload,
    );

  assert.doesNotMatch(
    durable,
    /replacement-secret-token/,
  );

  assert.doesNotMatch(
    durable,
    /\/access\//,
  );

  assert.equal(
    delivery.input.rawPayload.recoveryOfGrantId,
    "grant-old",
  );

  console.log(
    "DSI_V2_RECOVERY_SINGLE_RECIPIENT_DELIVERY_OK",
  );

  console.log(
    "DSI_V2_RECOVERY_DELIVERY_KEY_BINDS_REPLACEMENT_GRANT_OK",
  );

  console.log(
    "DSI_V2_RECOVERY_BEARER_EXCLUDED_FROM_DURABLE_METADATA_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
