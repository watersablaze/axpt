import { spawnSync } from "node:child_process";

const environment = process.env.VERCEL_ENV;

if (environment === "preview") {
  console.log(
    "DSI_PRODUCTION_MIGRATION_RECONCILIATION_SKIPPED_IN_PREVIEW",
  );
  process.exit(0);
}

if (environment !== "production") {
  throw new Error(
    "DSI_MIGRATION_RECONCILIATION_REQUIRES_PRODUCTION",
  );
}

const pooledValue = process.env.DATABASE_URL;

if (!pooledValue || pooledValue === "[SENSITIVE]") {
  throw new Error("PRODUCTION_DATABASE_URL_UNAVAILABLE");
}

const pooledUrl = new URL(pooledValue);

if (
  !pooledUrl.hostname.includes("-pooler.") ||
  !pooledUrl.hostname.endsWith(".neon.tech")
) {
  throw new Error("EXPECTED_NEON_POOLER_URL_NOT_FOUND");
}

const directUrl = new URL(pooledUrl.toString());

directUrl.hostname = directUrl.hostname.replace(
  "-pooler.",
  ".",
);

const migrationEnvironment = {
  ...process.env,
  DIRECT_URL: directUrl.toString(),
};

const runPrisma = (arguments_) => {
  const result = spawnSync(
    "node_modules/.bin/prisma",
    arguments_,
    {
      stdio: "inherit",
      env: migrationEnvironment,
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

console.log(
  "DSI_PRODUCTION_MIGRATION_RECONCILIATION_START",
);

runPrisma([
  "migrate",
  "resolve",
  "--applied",
  "20260919194000_add_treasury_settlement_observation",
]);

console.log(
  "DSI_OBSERVATION_MIGRATION_HISTORY_RECONCILED",
);

runPrisma([
  "migrate",
  "resolve",
  "--applied",
  "20260921163000_bind_access_grants_to_instrument_versions",
]);

console.log(
  "DSI_VERSION_BINDING_MIGRATION_HISTORY_RECONCILED",
);

runPrisma([
  "migrate",
  "status",
]);

console.log(
  "DSI_PRODUCTION_MIGRATION_RECONCILIATION_COMPLETE",
);
