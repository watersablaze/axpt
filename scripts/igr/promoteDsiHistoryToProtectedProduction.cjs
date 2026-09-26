const crypto = require("crypto");
const {
  PrismaClient,
} = require("@prisma/client");

const REFERENCE =
  "FW-DSI-2026-001";

const PUBLIC_ID =
  "fw-dsi-2026-001";

const OPERATOR_ID =
  "cmnvt0mri0000w02q1lbj123g";

const PRODUCTION_BRANCH =
  "br-falling-fog-aech88q1";

const SOURCE_BRANCH =
  "br-orange-fire-ae5097kr";

const ROLLBACK_SENTINEL =
  "AXPT_IGR_PROMOTION_ROLLBACK_PROOF";

const EXPECTED = Object.freeze({
  instrument:
    "5e7bd29d34802c8b71a123a40680e74567c30f6ea26a3cd5ff193dcf60800736",

  dsi:
    "c6c5f2278bab5065f7c4bd69220ff066b24c89d2fbdee119141d37ac7d1da5ee",

  versions:
    "4b80c8c65bac882975af64fdd2b784a1e5547c4844adcf9c262f9621e4d26bfa",

  parties:
    "2f654f336b844687dfb21d8ba743623f514d9b1652af944494ce0ad455ad2629",

  grants:
    "1bc477736e7314ad9a7f8dc4749fd7138a591d4f224dafb9b23646ee21ebe2e0",

  events:
    "8c15c62af08943dc4844be96c4661627530fedbf353b9368a02c5be0ce3d3482",
});

const EXPECTED_V2_RECIPIENTS =
  Object.freeze([
    "Carl Albert Meisterlin",
    "Corey Keller",
    "Dr. Don C. Hinds",
    "Bobby",
    "Lawrence",
  ]);

function requireEnv(name) {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `ENV_REQUIRED=${name}`
    );
  }

  return value;
}

function stableHash(value) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify(value)
    )
    .digest("hex");
}

/*
 * The development source predates the two
 * recognition-binding columns now present in
 * protected Production.
 *
 * ABSENT on the historical source means no
 * recognition binding existed. At the newer
 * destination schema that state is represented
 * explicitly as NULL.
 */
function normalizeDsiForDestination(row) {
  return {
    ...row,
    verificationObservationId:
      row.verificationObservationId ?? null,
    verificationInstrumentVersionId:
      row.verificationInstrumentVersionId ?? null,
  };
}

/*
 * Destination-equivalence hash only.
 *
 * The locked source manifest hash remains the
 * original 35-column historical record. This
 * helper compares source and destination after
 * the two newer nullable fields are normalized.
 */
function normalizedDsiHash(rows) {
  const normalized =
    rows.map((row) =>
      Object.fromEntries(
        Object.entries(
          normalizeDsiForDestination(row)
        ).sort(
          ([left], [right]) =>
            left.localeCompare(right)
        )
      )
    );

  return stableHash(normalized);
}

function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(message);
  }
}

function sorted(values) {
  return [...values].sort();
}

async function identity(client) {
  const rows =
    await client.$queryRawUnsafe(`
      SELECT
        current_database() AS database,
        current_user AS role,
        current_setting(
          'neon.branch_id',
          true
        ) AS branch_id,
        current_setting(
          'neon.project_id',
          true
        ) AS project_id
    `);

  return rows[0];
}

async function readManifest(source) {
  const instrument =
    await source.$queryRawUnsafe(`
      SELECT *
      FROM "InstitutionalInstrument"
      WHERE reference = $1
    `, REFERENCE);

  assert(
    instrument.length === 1,
    "SOURCE_INSTRUMENT_NOT_UNIQUE"
  );

  const instrumentId =
    instrument[0].id;

  const dsi =
    await source.$queryRawUnsafe(`
      SELECT *
      FROM "DigitalSettlementInstruction"
      WHERE "instrumentId" = $1
    `, instrumentId);

  const versions =
    await source.$queryRawUnsafe(`
      SELECT *
      FROM "InstrumentVersion"
      WHERE "instrumentId" = $1
      ORDER BY number
    `, instrumentId);

  const parties =
    await source.$queryRawUnsafe(`
      SELECT *
      FROM "InstrumentParty"
      WHERE "instrumentId" = $1
      ORDER BY "createdAt", id
    `, instrumentId);

  /*
   * Credential hashes are deliberately NOT selected.
   *
   * The historical rows are promoted, but old bearer
   * credential authority is never copied into protected
   * Production.
   */
  const grants =
    await source.$queryRawUnsafe(`
      SELECT
        id,
        "instrumentId",
        "instrumentVersionId",
        "recipientUserId",
        "recipientName",
        "recipientRole"::text
          AS "recipientRole",
        "accessLevel"::text
          AS "accessLevel",
        CASE
          WHEN "codeHash" IS NULL
            THEN false
          ELSE true
        END AS "hadCredential",
        "issuedByUserId",
        "issuedAt",
        "expiresAt",
        "revokedAt",
        "firstAccessAt",
        "lastAccessAt"
      FROM "InstrumentAccessGrant"
      WHERE "instrumentId" = $1
      ORDER BY "issuedAt", id
    `, instrumentId);

  const events =
    await source.$queryRawUnsafe(`
      SELECT *
      FROM "DomainEvent"
      WHERE "streamId" = $1
      ORDER BY
        "occurredAt",
        "createdAt",
        id
    `, instrumentId);

  return {
    instrument,
    dsi,
    versions,
    parties,
    grants,
    events,
  };
}

function verifyManifest(manifest) {
  assert(
    manifest.instrument.length === 1,
    "SOURCE_INSTRUMENT_COUNT_DRIFT"
  );

  assert(
    manifest.dsi.length === 1,
    "SOURCE_DSI_COUNT_DRIFT"
  );

  assert(
    manifest.versions.length === 2,
    "SOURCE_VERSION_COUNT_DRIFT"
  );

  assert(
    manifest.parties.length === 2,
    "SOURCE_PARTY_COUNT_DRIFT"
  );

  assert(
    manifest.grants.length === 7,
    "SOURCE_GRANT_COUNT_DRIFT"
  );

  assert(
    manifest.events.length === 24,
    "SOURCE_EVENT_COUNT_DRIFT"
  );

  const hashes = {
    instrument:
      stableHash(
        manifest.instrument
      ),

    dsi:
      stableHash(
        manifest.dsi
      ),

    versions:
      stableHash(
        manifest.versions
      ),

    parties:
      stableHash(
        manifest.parties
      ),

    grants:
      stableHash(
        manifest.grants
      ),

    events:
      stableHash(
        manifest.events
      ),
  };

  for (
    const [key, expected]
    of Object.entries(EXPECTED)
  ) {
    assert(
      hashes[key] === expected,
      `SOURCE_MANIFEST_HASH_DRIFT_${key.toUpperCase()} expected=${expected} actual=${hashes[key]}`
    );
  }

  const instrument =
    manifest.instrument[0];

  const dsi =
    manifest.dsi[0];

  assert(
    instrument.reference ===
      REFERENCE,
    "SOURCE_REFERENCE_DRIFT"
  );

  assert(
    instrument.status ===
      "ISSUED",
    "SOURCE_INSTRUMENT_STATUS_DRIFT"
  );

  assert(
    instrument.currentVersion ===
      2,
    "SOURCE_CURRENT_VERSION_DRIFT"
  );

  assert(
    instrument.createdByUserId ===
      OPERATOR_ID,
    "SOURCE_CREATOR_AUTHORITY_DRIFT"
  );

  assert(
    dsi.publicId === PUBLIC_ID,
    "SOURCE_PUBLIC_ID_DRIFT"
  );

  assert(
    dsi.settlementStatus ===
      "AWAITING_VERIFICATION_TRANSFER",
    "SOURCE_SETTLEMENT_STATUS_DRIFT"
  );

  assert(
    String(
      dsi.verificationAmountUsdt
    ) === "50",
    "SOURCE_VERIFICATION_AMOUNT_DRIFT"
  );

  assert(
    dsi.verificationTxHash === null,
    "SOURCE_VERIFICATION_ALREADY_RECOGNIZED"
  );

  assert(
    (
      dsi.verificationObservationId ??
      null
    ) === null,
    "SOURCE_VERIFICATION_OBSERVATION_PRESENT"
  );

  assert(
    (
      dsi.verificationInstrumentVersionId ??
      null
    ) === null,
    "SOURCE_VERIFICATION_VERSION_BINDING_PRESENT"
  );

  assert(
    dsi.verificationConfirmedAt ===
      null,
    "SOURCE_VERIFICATION_CONFIRMATION_PRESENT"
  );

  assert(
    dsi.principalAuthorizedAt ===
      null,
    "SOURCE_PRINCIPAL_ALREADY_AUTHORIZED"
  );

  const v2 =
    manifest.versions.find(
      (row) => row.number === 2
    );

  assert(
    v2 &&
      v2.status === "ISSUED",
    "SOURCE_V2_NOT_ISSUED"
  );

  const v1 =
    manifest.versions.find(
      (row) => row.number === 1
    );

  assert(
    v1 &&
      v1.status === "SUPERSEDED",
    "SOURCE_V1_NOT_SUPERSEDED"
  );

  const versioned =
    manifest.grants.filter(
      (grant) =>
        grant.instrumentVersionId ===
        v2.id
    );

  const unversioned =
    manifest.grants.filter(
      (grant) =>
        grant.instrumentVersionId ===
        null
    );

  assert(
    versioned.length === 5,
    "SOURCE_V2_GRANT_COUNT_DRIFT"
  );

  assert(
    unversioned.length === 2,
    "SOURCE_UNVERSIONED_GRANT_COUNT_DRIFT"
  );

  const recipients =
    sorted(
      versioned.map(
        (grant) =>
          grant.recipientName
      )
    );

  assert(
    JSON.stringify(recipients) ===
      JSON.stringify(
        sorted(
          EXPECTED_V2_RECIPIENTS
        )
      ),
    "SOURCE_V2_RECIPIENT_SET_DRIFT"
  );

  assert(
    manifest.grants.every(
      (grant) =>
        grant.issuedByUserId ===
        OPERATOR_ID
    ),
    "SOURCE_GRANT_ISSUER_DRIFT"
  );

  assert(
    manifest.grants.every(
      (grant) =>
        grant.hadCredential === true
    ),
    "SOURCE_EXPECTED_CREDENTIAL_HISTORY_DRIFT"
  );

  const differingEventActors =
    manifest.events.filter(
      (event) =>
        event.metadata &&
        typeof event.metadata ===
          "object" &&
        event.metadata.actorUserId &&
        event.metadata.actorUserId !==
          OPERATOR_ID
    );

  assert(
    differingEventActors.length === 0,
    "SOURCE_EVENT_ACTOR_DRIFT"
  );

  return hashes;
}

async function verifyOperator(
  production
) {
  const users =
    await production.$queryRawUnsafe(`
      SELECT
        id,
        email,
        "isAdmin"
      FROM "User"
      WHERE id = $1
        AND lower(email) =
          lower('connect@axpt.io')
    `, OPERATOR_ID);

  assert(
    users.length === 1,
    "PRODUCTION_OPERATOR_MISSING"
  );

  assert(
    users[0].isAdmin === true,
    "PRODUCTION_OPERATOR_NOT_ADMIN"
  );

  const roles =
    await production.$queryRawUnsafe(`
      SELECT r.key
      FROM "UserRole" ur
      JOIN "Role" r
        ON r.id = ur."roleId"
      WHERE ur."userId" = $1
        AND ur."isActive" = true
        AND ur."revokedAt" IS NULL
      ORDER BY r.key
    `, OPERATOR_ID);

  const roleSet =
    new Set(
      roles.map(
        (row) => row.key
      )
    );

  for (
    const required
    of [
      "ADMIN_PLATFORM",
      "CONTRACT_OPERATOR",
      "TREASURY_APPROVER",
    ]
  ) {
    assert(
      roleSet.has(required),
      `PRODUCTION_OPERATOR_ROLE_MISSING=${required}`
    );
  }
}

async function assertNoProductionCollisions(
  production,
  manifest
) {
  const instrument =
    manifest.instrument[0];

  const dsi =
    manifest.dsi[0];

  const instrumentCollision =
    await production
      .institutionalInstrument
      .findFirst({
        where: {
          OR: [
            {
              id:
                instrument.id,
            },
            {
              reference:
                REFERENCE,
            },
          ],
        },
        select: {
          id: true,
          reference: true,
        },
      });

  assert(
    !instrumentCollision,
    "PRODUCTION_INSTRUMENT_COLLISION"
  );

  const dsiCollision =
    await production
      .digitalSettlementInstruction
      .findFirst({
        where: {
          OR: [
            {
              id: dsi.id,
            },
            {
              publicId:
                PUBLIC_ID,
            },
          ],
        },
        select: {
          id: true,
          publicId: true,
        },
      });

  assert(
    !dsiCollision,
    "PRODUCTION_DSI_COLLISION"
  );

  const versionCollisions =
    await production
      .instrumentVersion
      .count({
        where: {
          id: {
            in:
              manifest.versions.map(
                (row) => row.id
              ),
          },
        },
      });

  const partyCollisions =
    await production
      .instrumentParty
      .count({
        where: {
          id: {
            in:
              manifest.parties.map(
                (row) => row.id
              ),
          },
        },
      });

  const grantCollisions =
    await production
      .instrumentAccessGrant
      .count({
        where: {
          id: {
            in:
              manifest.grants.map(
                (row) => row.id
              ),
          },
        },
      });

  const eventCollisions =
    await production
      .domainEvent
      .count({
        where: {
          id: {
            in:
              manifest.events.map(
                (row) => row.id
              ),
          },
        },
      });

  assert(
    versionCollisions === 0,
    "PRODUCTION_VERSION_ID_COLLISION"
  );

  assert(
    partyCollisions === 0,
    "PRODUCTION_PARTY_ID_COLLISION"
  );

  assert(
    grantCollisions === 0,
    "PRODUCTION_GRANT_ID_COLLISION"
  );

  assert(
    eventCollisions === 0,
    "PRODUCTION_EVENT_ID_COLLISION"
  );
}

async function countProductionDsiEmails(
  production
) {
  const rows =
    await production.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS count
      FROM "email_logs"
      WHERE
        type LIKE 'DSI_%'
        OR subject ILIKE
          '%FW-DSI-2026-001%'
    `);

  return rows[0].count;
}

async function verifyHistoricalEmailEvidence(
  source
) {
  const rows =
    await source.$queryRawUnsafe(`
      SELECT
        id,
        type,
        status,
        CASE
          WHEN "messageId" IS NULL
            THEN false
          ELSE true
        END AS "hasMessageId"
      FROM "email_logs"
      WHERE
        type LIKE 'DSI_%'
        OR subject ILIKE
          '%FW-DSI-2026-001%'
      ORDER BY "createdAt", id
    `);

  assert(
    rows.length === 9,
    `SOURCE_DSI_EMAIL_EVIDENCE_COUNT_DRIFT=${rows.length}`
  );

  assert(
    rows.every(
      (row) =>
        row.status === "SENT" &&
        row.hasMessageId === true
    ),
    "SOURCE_DSI_EMAIL_EVIDENCE_STATE_DRIFT"
  );

  return rows.length;
}

function grantCreateData(
  grant
) {
  const {
    hadCredential,
    ...historical
  } = grant;

  return {
    ...historical,

    /*
     * Deliberate security boundary:
     * historical bearer-token hashes are
     * never promoted.
     */
    codeHash: null,
  };
}

function decimalText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return value.toString();
}

/*
 * The release schema is newer than the generated
 * Prisma Client available in the isolated runtime.
 *
 * Keep this adapter intentionally narrow:
 * only DigitalSettlementInstruction uses raw SQL
 * here because its newer scalar fields are absent
 * from the generated client.
 *
 * Query text is static and every value is bound as
 * a PostgreSQL parameter.
 */
async function insertDsiWithRawSql(
  tx,
  sourceRow
) {
  const row =
    normalizeDsiForDestination(
      sourceRow
    );

  const affected =
    await tx.$executeRawUnsafe(
      `
      INSERT INTO
        "DigitalSettlementInstruction"
      (
        "id",
        "instrumentId",
        "publicId",
        "counterpartyName",
        "counterpartyRepresentative",
        "commodity",
        "transactionDescription",
        "settlementPurpose",
        "proceduralBasis",
        "quantityKg",
        "pricingStatus",
        "pricingBasis",
        "spotDiscountPercentage",
        "spotBenchmark",
        "spotPricePerKgUsd",
        "pricePerKgUsd",
        "transactionValueUsd",
        "settlementPercentage",
        "settlementAmountUsd",
        "priceFixedAt",
        "settlementAsset",
        "settlementNetwork",
        "receivingEntity",
        "receivingAddress",
        "receivingWalletId",
        "receivingWalletRole",
        "verificationAmountUsdt",
        "verificationTxHash",
        "verificationObservationId",
        "verificationInstrumentVersionId",
        "verificationConfirmedAt",
        "principalAuthorizedAt",
        "settlementStatus",
        "settlementDetectedAt",
        "settlementConfirmedAt",
        "createdAt",
        "updatedAt"
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10::numeric,
        $11::"DigitalSettlementPricingStatus",
        $12,
        $13::numeric,
        $14,
        $15::numeric,
        $16::numeric,
        $17::numeric,
        $18::numeric,
        $19::numeric,
        $20,
        $21::"DigitalSettlementAsset",
        $22::"DigitalSettlementNetwork",
        $23,
        $24,
        $25,
        $26,
        $27::numeric,
        $28,
        $29,
        $30,
        $31,
        $32,
        $33::"DigitalSettlementStatus",
        $34,
        $35,
        $36,
        $37
      )
      `,
      row.id,
      row.instrumentId,
      row.publicId,
      row.counterpartyName,
      row.counterpartyRepresentative,
      row.commodity,
      row.transactionDescription,
      row.settlementPurpose,
      row.proceduralBasis,
      decimalText(row.quantityKg),
      row.pricingStatus,
      row.pricingBasis,
      decimalText(
        row.spotDiscountPercentage
      ),
      row.spotBenchmark,
      decimalText(
        row.spotPricePerKgUsd
      ),
      decimalText(
        row.pricePerKgUsd
      ),
      decimalText(
        row.transactionValueUsd
      ),
      decimalText(
        row.settlementPercentage
      ),
      decimalText(
        row.settlementAmountUsd
      ),
      row.priceFixedAt,
      row.settlementAsset,
      row.settlementNetwork,
      row.receivingEntity,
      row.receivingAddress,
      row.receivingWalletId,
      row.receivingWalletRole,
      decimalText(
        row.verificationAmountUsdt
      ),
      row.verificationTxHash,
      row.verificationObservationId,
      row.verificationInstrumentVersionId,
      row.verificationConfirmedAt,
      row.principalAuthorizedAt,
      row.settlementStatus,
      row.settlementDetectedAt,
      row.settlementConfirmedAt,
      row.createdAt,
      row.updatedAt
    );

  assert(
    affected === 1,
    `DSI_RAW_INSERT_COUNT_INVALID=${affected}`
  );
}

/*
 * instrumentVersionId was also added after the
 * available generated Prisma Client.
 *
 * Historical credential hashes remain deliberately
 * NULL and are never selected from the source.
 */
async function insertGrantWithRawSql(
  tx,
  sourceGrant
) {
  const grant =
    grantCreateData(
      sourceGrant
    );

  const affected =
    await tx.$executeRawUnsafe(
      `
      INSERT INTO
        "InstrumentAccessGrant"
      (
        "id",
        "instrumentId",
        "instrumentVersionId",
        "recipientUserId",
        "recipientName",
        "recipientRole",
        "accessLevel",
        "codeHash",
        "issuedByUserId",
        "issuedAt",
        "expiresAt",
        "revokedAt",
        "firstAccessAt",
        "lastAccessAt"
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6::"InstrumentPartyRole",
        $7::"InstrumentAccessLevel",
        NULL,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13
      )
      `,
      grant.id,
      grant.instrumentId,
      grant.instrumentVersionId,
      grant.recipientUserId,
      grant.recipientName,
      grant.recipientRole,
      grant.accessLevel,
      grant.issuedByUserId,
      grant.issuedAt,
      grant.expiresAt,
      grant.revokedAt,
      grant.firstAccessAt,
      grant.lastAccessAt
    );

  assert(
    affected === 1,
    `GRANT_RAW_INSERT_COUNT_INVALID=${affected}`
  );
}

function expectedNeutralGrantManifest(
  grants
) {
  return grants.map(
    (grant) => ({
      ...grant,
      hadCredential: false,
    })
  );
}

async function readDestinationManifest(
  client,
  instrumentId
) {
  const instrument =
    await client.$queryRawUnsafe(`
      SELECT *
      FROM "InstitutionalInstrument"
      WHERE reference = $1
    `, REFERENCE);

  const dsi =
    await client.$queryRawUnsafe(`
      SELECT *
      FROM "DigitalSettlementInstruction"
      WHERE "instrumentId" = $1
    `, instrumentId);

  const versions =
    await client.$queryRawUnsafe(`
      SELECT *
      FROM "InstrumentVersion"
      WHERE "instrumentId" = $1
      ORDER BY number
    `, instrumentId);

  const parties =
    await client.$queryRawUnsafe(`
      SELECT *
      FROM "InstrumentParty"
      WHERE "instrumentId" = $1
      ORDER BY "createdAt", id
    `, instrumentId);

  const grants =
    await client.$queryRawUnsafe(`
      SELECT
        id,
        "instrumentId",
        "instrumentVersionId",
        "recipientUserId",
        "recipientName",
        "recipientRole"::text
          AS "recipientRole",
        "accessLevel"::text
          AS "accessLevel",
        CASE
          WHEN "codeHash" IS NULL
            THEN false
          ELSE true
        END AS "hadCredential",
        "issuedByUserId",
        "issuedAt",
        "expiresAt",
        "revokedAt",
        "firstAccessAt",
        "lastAccessAt"
      FROM "InstrumentAccessGrant"
      WHERE "instrumentId" = $1
      ORDER BY "issuedAt", id
    `, instrumentId);

  const events =
    await client.$queryRawUnsafe(`
      SELECT *
      FROM "DomainEvent"
      WHERE "streamId" = $1
      ORDER BY
        "occurredAt",
        "createdAt",
        id
    `, instrumentId);

  return {
    instrument,
    dsi,
    versions,
    parties,
    grants,
    events,
  };
}

async function verifyDestination(
  client,
  sourceManifest,
  sourceHashes
) {
  const instrumentId =
    sourceManifest.instrument[0].id;

  const destination =
    await readDestinationManifest(
      client,
      instrumentId
    );

  assert(
    destination.instrument.length ===
      1,
    "DESTINATION_INSTRUMENT_COUNT_INVALID"
  );

  assert(
    destination.dsi.length === 1,
    "DESTINATION_DSI_COUNT_INVALID"
  );

  assert(
    destination.versions.length === 2,
    "DESTINATION_VERSION_COUNT_INVALID"
  );

  assert(
    destination.parties.length === 2,
    "DESTINATION_PARTY_COUNT_INVALID"
  );

  assert(
    destination.grants.length === 7,
    "DESTINATION_GRANT_COUNT_INVALID"
  );

  assert(
    destination.events.length === 24,
    "DESTINATION_EVENT_COUNT_INVALID"
  );

  assert(
    stableHash(
      destination.instrument
    ) === sourceHashes.instrument,
    "DESTINATION_INSTRUMENT_HISTORY_MISMATCH"
  );

  assert(
    normalizedDsiHash(
      destination.dsi
    ) === normalizedDsiHash(
      sourceManifest.dsi
    ),
    "DESTINATION_DSI_HISTORY_MISMATCH"
  );

  assert(
    stableHash(
      destination.versions
    ) === sourceHashes.versions,
    "DESTINATION_VERSION_HISTORY_MISMATCH"
  );

  assert(
    stableHash(
      destination.parties
    ) === sourceHashes.parties,
    "DESTINATION_PARTY_HISTORY_MISMATCH"
  );

  assert(
    stableHash(
      destination.events
    ) === sourceHashes.events,
    "DESTINATION_EVENT_HISTORY_MISMATCH"
  );

  const expectedGrants =
    expectedNeutralGrantManifest(
      sourceManifest.grants
    );

  assert(
    stableHash(
      destination.grants
    ) === stableHash(
      expectedGrants
    ),
    "DESTINATION_GRANT_HISTORY_MISMATCH"
  );

  assert(
    destination.grants.every(
      (grant) =>
        grant.hadCredential ===
        false
    ),
    "DESTINATION_LEGACY_CREDENTIAL_AUTHORITY_PRESENT"
  );

  const v2 =
    sourceManifest.versions.find(
      (row) => row.number === 2
    );

  const activeV2 =
    destination.grants.filter(
      (grant) =>
        grant.instrumentVersionId ===
          v2.id &&
        grant.revokedAt === null
    );

  assert(
    activeV2.length === 5,
    `DESTINATION_V2_PREDECESSOR_COUNT_INVALID=${activeV2.length}`
  );

  const activeUnversioned =
    destination.grants.filter(
      (grant) =>
        grant.instrumentVersionId ===
          null &&
        grant.revokedAt === null
    );

  assert(
    activeUnversioned.length === 1,
    `DESTINATION_LEGACY_UNVERSIONED_HISTORY_COUNT_INVALID=${activeUnversioned.length}`
  );

  const canonical =
    destination.dsi[0];

  assert(
    canonical.settlementStatus ===
      "AWAITING_VERIFICATION_TRANSFER",
    "DESTINATION_SETTLEMENT_STATUS_CHANGED"
  );

  assert(
    canonical.verificationTxHash ===
      null &&
    canonical.verificationObservationId ===
      null &&
    canonical.verificationInstrumentVersionId ===
      null &&
    canonical.verificationConfirmedAt ===
      null &&
    canonical.principalAuthorizedAt ===
      null,
    "DESTINATION_RECOGNITION_STATE_CHANGED"
  );

  return destination;
}

async function assertAbsentAfterRollback(
  production,
  sourceManifest
) {
  const instrumentId =
    sourceManifest.instrument[0].id;

  const instrumentCount =
    await production
      .institutionalInstrument
      .count({
        where: {
          OR: [
            {
              id:
                instrumentId,
            },
            {
              reference:
                REFERENCE,
            },
          ],
        },
      });

  const versionCount =
    await production
      .instrumentVersion
      .count({
        where: {
          id: {
            in:
              sourceManifest
                .versions
                .map(
                  (row) => row.id
                ),
          },
        },
      });

  const partyCount =
    await production
      .instrumentParty
      .count({
        where: {
          id: {
            in:
              sourceManifest
                .parties
                .map(
                  (row) => row.id
                ),
          },
        },
      });

  const grantCount =
    await production
      .instrumentAccessGrant
      .count({
        where: {
          id: {
            in:
              sourceManifest
                .grants
                .map(
                  (row) => row.id
                ),
          },
        },
      });

  const eventCount =
    await production
      .domainEvent
      .count({
        where: {
          id: {
            in:
              sourceManifest
                .events
                .map(
                  (row) => row.id
                ),
          },
        },
      });

  assert(
    instrumentCount === 0 &&
    versionCount === 0 &&
    partyCount === 0 &&
    grantCount === 0 &&
    eventCount === 0,
    "ROLLBACK_DID_NOT_RESTORE_EMPTY_PRODUCTION_BOUNDARY"
  );
}

async function main() {
  const mode =
    requireEnv(
      "AXPT_IGR_PROMOTION_MODE"
    )
      .trim()
      .toUpperCase();

  assert(
    mode === "ROLLBACK" ||
      mode === "COMMIT",
    "PROMOTION_MODE_MUST_BE_ROLLBACK_OR_COMMIT"
  );

  if (mode === "COMMIT") {
    assert(
      process.env
        .AXPT_IGR_PROMOTION_CONFIRM ===
        REFERENCE,
      "PROMOTION_COMMIT_CONFIRMATION_REQUIRED"
    );
  }

  const productionUrl =
    requireEnv(
      "AXPT_PROTECTED_PRODUCTION_DATABASE_URL"
    );

  const sourceUrl =
    requireEnv(
      "AXPT_DSI_SOURCE_DATABASE_URL"
    );

  assert(
    productionUrl !== sourceUrl,
    "SOURCE_AND_DESTINATION_DATABASES_MUST_DIFFER"
  );

  const production =
    new PrismaClient({
      datasources: {
        db: {
          url: productionUrl,
        },
      },
    });

  const source =
    new PrismaClient({
      datasources: {
        db: {
          url: sourceUrl,
        },
      },
    });

  try {
    const prodIdentity =
      await identity(
        production
      );

    const sourceIdentity =
      await identity(
        source
      );

    console.log(
      "production_branch=" +
      prodIdentity.branch_id
    );

    console.log(
      "source_branch=" +
      sourceIdentity.branch_id
    );

    assert(
      prodIdentity.branch_id ===
        PRODUCTION_BRANCH,
      `PRODUCTION_BRANCH_MISMATCH=${prodIdentity.branch_id}`
    );

    assert(
      sourceIdentity.branch_id ===
        SOURCE_BRANCH,
      `SOURCE_BRANCH_MISMATCH=${sourceIdentity.branch_id}`
    );

    await verifyOperator(
      production
    );

    console.log(
      "✓ protected Production operator authority confirmed"
    );

    const manifest =
      await readManifest(
        source
      );

    const hashes =
      verifyManifest(
        manifest
      );

    console.log(
      "✓ source manifest matches locked hashes"
    );

    const emailEvidenceCount =
      await verifyHistoricalEmailEvidence(
        source
      );

    console.log(
      "source_historical_email_evidence=" +
      emailEvidenceCount
    );

    console.log(
      "email_promotion_policy=SOURCE_RETAINED_NOT_IMPORTED"
    );

    await assertNoProductionCollisions(
      production,
      manifest
    );

    console.log(
      "✓ protected Production collision boundary clear"
    );

    const productionEmailsBefore =
      await countProductionDsiEmails(
        production
      );

    assert(
      productionEmailsBefore === 0,
      `PRODUCTION_DSI_EMAIL_LOG_ALREADY_PRESENT=${productionEmailsBefore}`
    );

    let expectedRollback = false;

    try {
      await production.$transaction(
        async (tx) => {
          const instrument =
            manifest.instrument[0];

          const dsi =
            manifest.dsi[0];

          await tx
            .institutionalInstrument
            .create({
              data:
                instrument,
            });

          for (
            const version
            of manifest.versions
          ) {
            await tx
              .instrumentVersion
              .create({
                data:
                  version,
              });
          }

          for (
            const party
            of manifest.parties
          ) {
            await tx
              .instrumentParty
              .create({
                data:
                  party,
              });
          }

          await insertDsiWithRawSql(
            tx,
            dsi
          );

          for (
            const grant
            of manifest.grants
          ) {
            await insertGrantWithRawSql(
              tx,
              grant
            );
          }

          for (
            const event
            of manifest.events
          ) {
            await tx
              .domainEvent
              .create({
                data:
                  event,
              });
          }

          await verifyDestination(
            tx,
            manifest,
            hashes
          );

          const txEmailCount =
            await tx.$queryRawUnsafe(`
              SELECT COUNT(*)::int
                AS count
              FROM "email_logs"
              WHERE
                type LIKE 'DSI_%'
                OR subject ILIKE
                  '%FW-DSI-2026-001%'
            `);

          assert(
            txEmailCount[0].count === 0,
            "PROMOTION_UNEXPECTEDLY_CREATED_EMAIL_LOG"
          );

          console.log(
            "✓ institutional history reproduced inside transaction"
          );

          console.log(
            "✓ all seven historical credential hashes neutralized"
          );

          console.log(
            "✓ five V2 predecessor rows ready for future controlled rotation"
          );

          console.log(
            "✓ settlement remains pre-recognition"
          );

          if (
            mode === "ROLLBACK"
          ) {
            throw new Error(
              ROLLBACK_SENTINEL
            );
          }
        },
        {
          maxWait: 10_000,
          timeout: 30_000,
        }
      );
    } catch (error) {
      if (
        mode === "ROLLBACK" &&
        error instanceof Error &&
        error.message ===
          ROLLBACK_SENTINEL
      ) {
        expectedRollback = true;
      } else {
        throw error;
      }
    }

    if (
      mode === "ROLLBACK"
    ) {
      assert(
        expectedRollback,
        "EXPECTED_ROLLBACK_DID_NOT_OCCUR"
      );

      await assertAbsentAfterRollback(
        production,
        manifest
      );

      const productionEmailsAfter =
        await countProductionDsiEmails(
          production
        );

      assert(
        productionEmailsAfter === 0,
        "ROLLBACK_CHANGED_PRODUCTION_EMAIL_HISTORY"
      );

      console.log(
        "✓ rollback restored empty Production DSI boundary"
      );

      console.log(
        "✓ no Production email history created"
      );

      console.log();
      console.log(
        "PROMOTION_ROLLBACK_PROOF_COMPLETE"
      );

      return;
    }

    /*
     * COMMIT verification.
     *
     * Re-read from the committed database after
     * the transaction boundary.
     */
    await verifyDestination(
      production,
      manifest,
      hashes
    );

    const productionEmailsAfter =
      await countProductionDsiEmails(
        production
      );

    assert(
      productionEmailsAfter === 0,
      "COMMIT_CREATED_PRODUCTION_EMAIL_HISTORY"
    );

    console.log();
    console.log(
      "PROMOTION_COMMIT_COMPLETE"
    );
  } finally {
    await production
      .$disconnect()
      .catch(() => {});

    await source
      .$disconnect()
      .catch(() => {});
  }
}

main().catch((error) => {
  console.error(
    "IGR_DSI_PROMOTION_FAILED:",
    error instanceof Error
      ? error.message
      : String(error)
  );

  process.exit(1);
});
