//npm run partners:list      npx tsx app/scripts/partner/listAccess.ts

import partnerTiers from '@/config/partnerTiers.json' assert { type: 'json' };
import tierDocs from '@/config/tierDocs.json' assert { type: 'json' };

const partners = partnerTiers as Record<string, string>;
const docs = tierDocs as Record<string, string[]>;

console.log('\n📋 Partner Tier Access Overview\n──────────────────────────────');

Object.entries(partners).forEach(([partner, tier]) => {
  const pdfs = docs[tier] || [];
  console.log(`👤 ${partner.padEnd(25)} → 🎖️ ${tier.padEnd(10)} → 📄 [${pdfs.join(', ')}]`);
});

console.log('──────────────────────────────\n');