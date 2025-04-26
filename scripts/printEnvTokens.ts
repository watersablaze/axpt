// scripts/printEnvTokens.ts

import 'dotenv/config';

// Define your expected environment variables
const partnerEnvVars = [
  { name: 'Queendom Collective', envKey: 'NEXT_PUBLIC_QUEENDOM_COLLECTIVE_TOKEN' },
  { name: 'Red Rollin Holdings', envKey: 'NEXT_PUBLIC_RED_ROLLIN_TOKEN' },
  { name: 'Limitech', envKey: 'NEXT_PUBLIC_LIMITECH_TOKEN' },
  { name: 'AXPT Admin Access', envKey: 'NEXT_PUBLIC_AXPT_ADMIN_TOKEN' },
];

console.log('🔎 Loaded Partner Tokens from .env File:');
console.log('===========================================');

partnerEnvVars.forEach(({ name, envKey }) => {
  const token = process.env[envKey];
  if (token) {
    console.log(`✅ ${name}: ${token}`);
  } else {
    console.warn(`⚠️  Missing token for ${name} (${envKey})`);
  }
});

console.log('===========================================');
console.log('✔️  Token check complete. If any are missing, verify your .env file.');
