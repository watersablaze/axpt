// decodeTokenPayload.ts
export function decodeTokenPayload(base64url: string) {
  const json = atob(base64url.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}