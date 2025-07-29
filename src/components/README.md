# Components Directory

This folder contains **shared and scoped UI components** for the AXPT platform.

## Structure

- `onboarding/` – components used in the `/onboard/investor` flow (e.g. TokenGate, VerifiedDashboard, WelcomeScreen)
- `shared/` – reusable components like animations or layout elements

## Import Alias

In `tsconfig.json`, this folder is aliased as:

```ts
@/components/* → app/src/components/*