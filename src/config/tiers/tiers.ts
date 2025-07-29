// ✅ FILE: app/src/config/tiers/tiers.ts
export const tiers = [
  'Investor',
  'Project Manager',
  'Broker',
  'Fund Manager',
  'Proprietor',
  'Custodial Steward',
  'Nomad / Trader',
  'Suppliers / Distributors',
  'Creative Producer',
] as const;

export type Tier = typeof tiers[number]; // 'Investor' | 'Project Manager' | ...