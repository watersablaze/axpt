// lib/debugEnv.ts

export function printPartnerTokensOnStartup() {
    const partnerTokens = {
      QUEENDOM_COLLECTIVE: process.env.NEXT_PUBLIC_QUEENDOM_COLLECTIVE_TOKEN,
      RED_ROLLIN: process.env.NEXT_PUBLIC_RED_ROLLIN_TOKEN,
      LIMITECH: process.env.NEXT_PUBLIC_LIMITECH_TOKEN,
      AXPT_ADMIN: process.env.NEXT_PUBLIC_AXPT_ADMIN_TOKEN,
    };
  
    console.log('🌱 AXPT Partner Tokens Loaded from .env:');
    console.table(partnerTokens);
  
    // Safety: Warn if any are missing
    Object.entries(partnerTokens).forEach(([key, value]) => {
      if (!value) {
        console.warn(`⚠️ WARNING: Token for ${key} is missing in your .env setup.`);
      }
    });
  }