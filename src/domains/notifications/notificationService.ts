import { prisma } from "@/lib/prisma"
import { NotificationType } from "./notificationTypes"

export async function createNotification({
  userId,
  caseId,
  message,
  type = "INFO",
}: {
  userId?: string
  caseId?: string
  message: string
  type?: NotificationType
}) {

  return prisma.notification.create({
    data: {
      userId,
      caseId,
      message,
      type,
    },
  })
}