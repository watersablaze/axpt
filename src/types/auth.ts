// types/auth.ts
export interface SessionPayload {
  userId: string;
  tier: string;
  displayName?: string;
  popupMessage?: string;
  docs?: string[];
}