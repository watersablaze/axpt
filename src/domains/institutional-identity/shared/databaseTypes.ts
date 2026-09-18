import type { prisma as runtimePrisma } from "@/infrastructure/db/prisma"

export type InstitutionalIdentityDatabaseClient =
  typeof runtimePrisma

export type InstitutionalIdentityTransactionClient = Omit<
  InstitutionalIdentityDatabaseClient,
  "$connect" |
  "$disconnect" |
  "$on" |
  "$transaction" |
  "$use" |
  "$extends"
>
