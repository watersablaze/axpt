// 📁 app/scripts/partner-tokens/token.ts

import '@/lib/env/loadEnv';
import { promptAndGenerateToken } from '@/lib/token/tokenService';
import type { TokenEntry } from '@/lib/token/tokenService';

(async () => {
  try {
    const { token, payload, qrPath, createdAt } = await promptAndGenerateToken() as TokenEntry;

    console.log('\n✅ Token Generation Complete!');
    console.log(`👤 Partner: ${payload.partner}`);
    console.log(`🎖️ Tier: ${payload.tier}`);
    console.log(`📄 Docs: ${payload.docs.join(', ')}`);
    console.log(`🔑 Token: ${token}`);
    if (qrPath) {
      console.log(`📦 QR Code Path: ${qrPath}`);
    }
    console.log(`📅 Created At: ${createdAt}`);
    console.log('');
  } catch (error) {
    console.error('❌ Token generation failed:', error);
  }
})();