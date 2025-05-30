// File: app/scripts/partner/listAccess.ts
import 'dotenv/config';
import partnerTiers from '@/config/partnerTiers.json' assert { type: 'json' };
import tierDocs from '@/config/tierDocs.json' assert { type: 'json' };

const partners = partnerTiers as Record<
  string,
  {
    tier: string;
    displayName: string;
    greeting: string;
  }
>;

const docs = tierDocs as Record<string, string[]>;

console.log('\n📋 Partner Tier Access Overview\n──────────────────────────────');

const foundTiers = new Set(Object.keys(docs));
const seenTiers = new Set<string>();

Object.entries(partners).forEach(([partner, info]) => {
  const { tier, displayName } = info;
  const pdfs = docs[tier];
  seenTiers.add(tier);

  if (!pdfs) {
    console.warn(`⚠️  Tier '${tier}' for partner '${partner}' is not defined in tierDocs.json`);
    console.log(`👤 ${displayName.padEnd(25)} → 🎖️ ${tier.padEnd(10)} → ⚠️ No PDF mapping`);
  } else {
    console.log(`👤 ${displayName.padEnd(25)} → 🎖️ ${tier.padEnd(10)} → 📄 [${pdfs.join(', ')}]`);
  }
});

// Find unused tiers
const unusedTiers = [...foundTiers].filter(t => !seenTiers.has(t));
if (unusedTiers.length > 0) {
  console.warn('\n⚠️  Unused tiers defined in tierDocs.json:');
  unusedTiers.forEach(t => {
    const pdfs = docs[t];
    if (!pdfs || pdfs.length === 0) {
      console.warn(`⚠️  Tier '${t}' has no PDFs assigned.`);
    } else {
      console.warn(`ℹ️  Tier '${t}' is defined but not assigned to any partner.`);
    }
  });
}

console.log('──────────────────────────────\n');