# Institutional Identity Bootstrap

The founding institutional bootstrap binds existing AXPT users to canonical internal institutional profiles.

Required environment variables:

- AXPT_MAYA_USERNAME
- AXPT_JAMAL_USERNAME
- AXPT_BOBBY_USERNAME
- AXPT_LAWRENCE_USERNAME

The bootstrap never creates AXPT users and does not contain credentials.

Run after the IA-1 and IA-2 migrations are applied:

```bash
pnpm exec dotenv -e .env.local -- \
  pnpm exec tsx \
  scripts/institutional-identity/bootstrapFoundingInstitutionalProfiles.ts
```

Verify:

```bash
pnpm exec dotenv -e .env.local -- \
  pnpm exec tsx \
  scripts/institutional-identity/smokeFoundingInstitutionalProfiles.ts
```

The bootstrap is intended to be idempotent. All four configured usernames must resolve before any profile or authority mutation begins.
