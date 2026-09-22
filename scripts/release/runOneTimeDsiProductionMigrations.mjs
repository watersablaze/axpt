import { spawnSync } from "node:child_process";

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

console.log(
  "ONE_TIME_DSI_PRODUCTION_MIGRATION_START",
);

const result = spawnSync(
  "node_modules/.bin/prisma",
  ["migrate", "deploy"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DIRECT_URL: directUrl.toString(),
    },
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(
  "ONE_TIME_DSI_PRODUCTION_MIGRATION_COMPLETE",
);
