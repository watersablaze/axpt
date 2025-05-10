// File: app/scripts/partner/tokenDebugger.ts

import 'dotenv/config';
import crypto from 'crypto';
import prompts from 'prompts';

const PARTNER_SECRET = process.env.PARTNER_SECRET as string;
if (!PARTNER_SECRET) {
  console.error('❌ Missing PARTNER_SECRET in .env');
  process.exit(1);
}

function decodeAndVerify(token: string) {
  const [encoded, sig] = token.split(':');
  if (!encoded || !sig) return { valid: false, reason: 'Malformed token.' };

  try {
    const json = Buffer.from(encoded, 'base64').toString('utf8');
    const parsed = JSON.parse(json);

    const expectedSig = crypto.createHmac('sha256', PARTNER_SECRET).update(json).digest('hex');
    const match = expectedSig === sig;

    return {
      valid: match,
      reason: match ? 'Valid signature ✅' : 'Signature mismatch ❌',
      payload: parsed,
      encoded,
      expectedSig
    };
  } catch (e) {
    return { valid: false, reason: 'Could not decode or parse JSON.' };
  }
}

(async () => {
  const { token } = await prompts({
    type: 'text',
    name: 'token',
    message: 'Paste token to decode and verify:'
  });

  if (!token) return;

  const result = decodeAndVerify(token);
  console.log('\n🔍 Token Inspection Result:');
  console.log('──────────────────────────────');
  console.log('Status:', result.reason);
  if (result.valid) {
    console.log('Decoded Payload:', result.payload);
    console.log('Expected Signature:', result.expectedSig);
  }
})();
