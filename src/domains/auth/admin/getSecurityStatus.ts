export async function getSecurityStatus() {
  return {
    principalEmail: 'Loading...',
    roles: [],
    permissionCount: 0,
    authSource: 'unknown',
    legacySignals: 0,
    environment: process.env.NODE_ENV,
  }
}