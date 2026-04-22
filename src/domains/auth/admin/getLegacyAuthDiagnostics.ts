export async function getLegacyAuthDiagnostics() {
  return {
    signals: [
      {
        label: 'requireResidentServer bypass',
        active: true,
        detail:
          'Legacy resident auth helper may bypass canonical principal resolution.',
      },
      {
        label: 'sessionFallback decoder',
        active: true,
        detail:
          'Fallback query/cookie decoding path still exists in auth surface.',
      },
      {
        label: 'dev_impersonate_email',
        active: true,
        detail:
          'Developer impersonation cookie support still present.',
      },
      {
        label: 'Legacy Treasury Actor Guard',
        active: true,
        detail:
          'Treasury actor helper not yet migrated to authority permission model.',
      },
      {
        label: 'Parallel Council Auth Flow',
        active: true,
        detail:
          'Council auth remains separate from canonical auth principal.',
      },
    ],
  }
}