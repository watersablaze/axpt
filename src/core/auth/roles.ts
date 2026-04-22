export const Roles = {
  TREASURY: "TREASURY",
  STRATEGY: "STRATEGY",
  ADMIN: "ADMIN",
} as const

export type Role = (typeof Roles)[keyof typeof Roles]