// 📁 scripts/testTokenRoundtrip.ts

import { generateTokenFromInput } from '@/lib/token/tokenService';
import { verifyToken } from '@/lib/token/verifyToken';
import type { AllowedDoc } from '@/lib/token/tokenSchema';

const TEST_USER = {
  partner: 'demo-partner',
  tier: 'Investor',
  userId: 'cli-demo-id',
  displayName: 'Ma’yá',
  greeting: 'Welcome, keyholder.',
  popupMessage: 'The vault is now open.',
  docs: ['whitepaper', 'chinje', 'hemp'] as AllowedDoc[],
};

async function run() {
  console.log('\n🔐 AXPT Token Roundtrip Test\n');

  // Generate
  const { token } = await generateTokenFromInput(TEST_USER);
  console.log('✅ Token generated:\n', token);

  // Verify
  const { valid, payload } = await verifyToken(token);
  if (!valid || !payload) {
    console.error('❌ Token failed verification');
    process.exit(1);
  }

  console.log('\n✅ Token verified successfully.\n');
  console.log('📦 Payload:', payload);

  // Simulate document URLs
  console.log('\n🔗 Accessible Docs:\n');
  payload.docs.forEach((doc) => {
    const url = `https://axpt.io/docs/${doc}?token=${encodeURIComponent(token)}`;
    console.log(`→ ${url}`);
  });

  console.log('\n🎉 Roundtrip complete.\n');
}

run().catch((err) => {
  console.error('🔥 Error during token test:', err);
  process.exit(1);
});