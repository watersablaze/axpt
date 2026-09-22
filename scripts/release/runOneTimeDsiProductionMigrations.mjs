import { PrismaClient } from "@prisma/client";

const environment = process.env.VERCEL_ENV;

if (environment === "preview") {
  console.log(
    "DSI_PRODUCTION_SCHEMA_AUDIT_SKIPPED_IN_PREVIEW",
  );
  process.exit(0);
}

if (environment !== "production") {
  throw new Error(
    "DSI_SCHEMA_AUDIT_REQUIRES_VERCEL_PRODUCTION",
  );
}

const prisma = new PrismaClient();

const stringify = (value) =>
  JSON.stringify(
    value,
    (_key, item) =>
      typeof item === "bigint"
        ? item.toString()
        : item,
    2,
  );

const printSection = (name, value) => {
  console.log("AUDIT_SECTION_START:" + name);
  console.log(stringify(value));
  console.log("AUDIT_SECTION_END:" + name);
};

try {
  console.log(
    "DSI_PRODUCTION_SCHEMA_AUDIT_START",
  );

  const migrations = await prisma.$queryRawUnsafe(
    "SELECT " +
      "migration_name, " +
      "checksum, " +
      "started_at::text AS started_at, " +
      "finished_at::text AS finished_at, " +
      "rolled_back_at::text AS rolled_back_at, " +
      "applied_steps_count, " +
      "(logs IS NOT NULL) AS has_logs " +
    "FROM \"_prisma_migrations\" " +
    "WHERE migration_name IN (" +
      "'20260919194000_add_treasury_settlement_observation'," +
      "'20260921163000_bind_access_grants_to_instrument_versions'" +
    ") " +
    "ORDER BY migration_name, started_at"
  );

  printSection("MIGRATION_HISTORY", migrations);

  const enums = await prisma.$queryRawUnsafe(
    "SELECT " +
      "t.typname AS enum_name, " +
      "e.enumsortorder::text AS enum_order, " +
      "e.enumlabel AS enum_value " +
    "FROM pg_type t " +
    "JOIN pg_enum e ON e.enumtypid = t.oid " +
    "JOIN pg_namespace n ON n.oid = t.typnamespace " +
    "WHERE n.nspname = 'public' " +
    "AND t.typname IN (" +
      "'TreasurySettlementObservationDirection'," +
      "'TreasurySettlementObservationStatus'" +
    ") " +
    "ORDER BY t.typname, e.enumsortorder"
  );

  printSection("ENUMS", enums);

  const columns = await prisma.$queryRawUnsafe(
    "SELECT " +
      "c.relname AS table_name, " +
      "a.attnum AS ordinal_position, " +
      "a.attname AS column_name, " +
      "format_type(a.atttypid, a.atttypmod) AS data_type, " +
      "a.attnotnull AS not_null, " +
      "pg_get_expr(ad.adbin, ad.adrelid) AS default_expression " +
    "FROM pg_attribute a " +
    "JOIN pg_class c ON c.oid = a.attrelid " +
    "JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "LEFT JOIN pg_attrdef ad " +
      "ON ad.adrelid = a.attrelid " +
      "AND ad.adnum = a.attnum " +
    "WHERE n.nspname = 'public' " +
    "AND c.relname IN (" +
      "'TreasurySettlementObservation'," +
      "'TreasurySettlementObservationCursor'," +
      "'InstrumentAccessGrant'" +
    ") " +
    "AND a.attnum > 0 " +
    "AND NOT a.attisdropped " +
    "ORDER BY c.relname, a.attnum"
  );

  printSection("COLUMNS", columns);

  const constraints = await prisma.$queryRawUnsafe(
    "SELECT " +
      "c.relname AS table_name, " +
      "con.conname AS constraint_name, " +
      "con.contype AS constraint_type, " +
      "pg_get_constraintdef(con.oid, true) AS definition " +
    "FROM pg_constraint con " +
    "JOIN pg_class c ON c.oid = con.conrelid " +
    "JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "WHERE n.nspname = 'public' " +
    "AND c.relname IN (" +
      "'TreasurySettlementObservation'," +
      "'TreasurySettlementObservationCursor'," +
      "'InstrumentAccessGrant'" +
    ") " +
    "ORDER BY c.relname, con.conname"
  );

  printSection("CONSTRAINTS", constraints);

  const indexes = await prisma.$queryRawUnsafe(
    "SELECT " +
      "tablename AS table_name, " +
      "indexname AS index_name, " +
      "indexdef AS definition " +
    "FROM pg_indexes " +
    "WHERE schemaname = 'public' " +
    "AND tablename IN (" +
      "'TreasurySettlementObservation'," +
      "'TreasurySettlementObservationCursor'," +
      "'InstrumentAccessGrant'" +
    ") " +
    "ORDER BY tablename, indexname"
  );

  printSection("INDEXES", indexes);

  console.log(
    "DSI_PRODUCTION_SCHEMA_AUDIT_COMPLETE",
  );
} finally {
  await prisma.$disconnect();
}

throw new Error(
  "INTENTIONAL_STOP_AFTER_READ_ONLY_PRODUCTION_SCHEMA_AUDIT",
);
