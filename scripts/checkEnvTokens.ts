// scripts/checkEnvTokens.ts

import 'dotenv/config';

const partnerTokens = {
  'Queendom Collective': process.env.NEXT_PUBLIC_QUEENDOM_COLLECTIVE_TOKEN,
  'Red Rollin Holdings': process.env.NEXT_PUBLIC_RED_ROLLIN_TOKEN,
  'Limitech': process.env.NEXT_PUBLIC_LIMITECH_TOKEN,
  'AXPT Admin Access': process.env.NEXT_PUBLIC_AXPT_ADMIN_TOKEN,
};

console.log('\n🔍 Checking Partner Tokens...\n');

let allTokensPresent = true;

Object.entries(partnerTokens).forEach(([partner, token]) => {
  if (token) {
    console.log(`✅ Loaded Token for ${partner}: ${token}`);
  } else {
    console.warn(`❌ Missing token for ${partner}. Check your .env file.`);
    allTokensPresent = false;
  }
});

if (allTokensPresent) {
  console.log('\n🎉 All partner tokens loaded successfully!\n');
  process.exit(0);
} else {
  console.error('\n⚠️ One or more partner tokens are missing. Please review your .env file.\n');
  process.exit(1);
}
