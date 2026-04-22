export type NotificationType =
  | "ACTION_REQUIRED"
  | "INFO"
  | "WARNING"

export type Notification = {
  id: string
  userId?: string
  caseId?: string
  message: string
  type: NotificationType
  createdAt: string
  read?: boolean
}