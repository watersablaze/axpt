import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const filename = process.argv[2];
if (!filename) throw new Error("Pass the preview environment file as the only argument.");
const preview = dotenv.parse(readFileSync(filename));
const url = new URL(preview.DATABASE_URL);
if (url.hostname !== "ep-delicate-block-aegpf1ip-pooler.c-2.us-east-2.aws.neon.tech" ||
    url.pathname !== "/neondb") throw new Error("Expected the GM preview database; stopped.");
url.hostname = "ep-delicate-block-aegpf1ip.c-2.us-east-2.aws.neon.tech";
const databaseUrl = url.href;
const env = { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl };
const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
const name = "20260929220000_gm_recipient_verification";
let folder;
function run(args) {
  const result = spawnSync("./node_modules/.bin/prisma", args, { env, stdio: "inherit" });
  if (result.error || result.status !== 0) throw result.error ?? new Error("Preview migration command failed.");
}
try {
  const [before] = await prisma.$queryRaw`
    SELECT current_database() AS database,
      to_regclass('public."InstrumentAccessGrant"') IS NOT NULL AS grants,
      to_regclass('public."InstrumentResponseSet"') IS NOT NULL AS responses,
      to_regclass('public."GlobalMotherDraftingDecision"') IS NOT NULL AS drafting,
      to_regclass('public."GlobalMotherRecipientChallenge"') IS NOT NULL AS challenge
  `;
  if (before.database !== "neondb" || !before.grants || !before.responses || !before.drafting)
    throw new Error("GM preview prerequisites differ; stopped.");
  const histories = await prisma.$queryRaw`
    SELECT finished_at FROM "_prisma_migrations" WHERE migration_name = ${name}
  `;
  if (histories.length && !histories[0].finished_at)
    throw new Error("The migration has an unfinished history record; inspect before retrying.");
  if (!before.challenge) {
    if (histories.length) throw new Error("Migration history and table differ; stopped.");
    const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
    folder = mkdtempSync(join(tmpdir(), "gm-recipient-migration-"));
    const path = join(folder, "migration.sql");
    writeFileSync(path, `BEGIN;\n${sql}\nCOMMIT;\n`);
    run(["db", "execute", "--file", path, "--schema", "prisma/schema.prisma"]);
  }
  const columns = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'GlobalMotherRecipientChallenge'
  `;
  const expected = ["grantId", "recipientUserId", "email", "pinHash", "nonceHash", "attemptCount",
    "expiresAt", "consumedAt", "sentAt", "windowStartedAt", "sendCount"].sort();
  if (JSON.stringify(columns.map(row => row.column_name).sort()) !== JSON.stringify(expected))
    throw new Error("Recipient challenge schema differs; stopped before marking history.");
  if (!histories.length) run(["migrate", "resolve", "--applied", name]);
  console.log("GM_RECIPIENT_PREVIEW_MIGRATION_READY");
} finally {
  await prisma.$disconnect();
  if (folder) rmSync(folder, { recursive: true, force: true });
}
