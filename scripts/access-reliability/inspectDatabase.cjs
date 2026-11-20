// Read-only schema/latency inspection. Never prints connection strings or row data.
const { createRequire } = require('node:module');
const fromNext = createRequire(require.resolve('next/package.json'));
fromNext('@next/env').loadEnvConfig(process.cwd(), true);
const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient({ log: [] });
(async () => {
  const started = Date.now();
  const tables = await client.$queryRaw`
    SELECT to_regclass('public."TreasuryAction"') IS NOT NULL AS "treasuryAction",
           to_regclass('public."TreasuryExecutionQueue"') IS NOT NULL AS "treasuryExecutionQueue",
           to_regclass('public."_prisma_migrations"') IS NOT NULL AS "migrationHistory"
  `;
  console.log({ schemaCheckMs: Date.now() - started, tables });
  if (tables[0].migrationHistory) {
    const migrations = await client.$queryRaw`
      SELECT migration_name, finished_at IS NOT NULL AS finished,
             rolled_back_at IS NOT NULL AS rolled_back
      FROM public."_prisma_migrations"
      WHERE migration_name IN ('20260418132438_add_treasury_execution_queue',
                               '20260418152140_treasury_execution_queue')
    `;
    console.log({ treasuryMigrations: migrations });
  }
  for (let i = 0; i < 3; i++) {
    const began = Date.now();
    await client.$queryRaw`SELECT 1`;
    console.log({ ping: i + 1, elapsedMs: Date.now() - began });
  }
})().catch(error => {
  console.error({ inspectionFailed: true, code: typeof error.code === 'string' ? error.code : 'UNKNOWN' });
  process.exitCode = 1;
}).finally(() => client.$disconnect());
