import type { prisma as runtimePrisma } from "@/infrastructure/db/prisma"

export type CommunicationsDatabaseClient =
  typeof runtimePrisma

export type CommunicationsTransactionClient = Omit<
  CommunicationsDatabaseClient,
  "$connect" |
  "$disconnect" |
  "$on" |
  "$transaction" |
  "$use" |
  "$extends"
>
