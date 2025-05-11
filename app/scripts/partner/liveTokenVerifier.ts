import 'dotenv/config';
import prompts from 'prompts';
import crypto from 'node:crypto';
import { normalizePartner } from './utils/normalize';
import { getEnv } from '@/lib/utils/readEnv';

const PARTNER_SECRET = getEnv('PARTNER_SECRET');

const signToken = (partner: string): string => {
  const normalized = normalizePartner(partner);
  const signature = crypto.createHmac('sha256', PARTNER_SECRET).update(normalized).digest('hex');
  return `${normalized}:${signature}`;
};

const verifyToken = (token: string): boolean => {
  const [rawPartner, signature] = token.split(':');
  const expected = crypto.createHmac('sha256', PARTNER_SECRET).update(rawPartner).digest('hex');
  return signature === expected;
};

async function main() {
  console.log('🔐 AXPT Live Token Verifier');
  console.log('──────────────────────────────\n');

  while (true) {
    const { partner } = await prompts({
      type: 'text',
      name: 'partner',
      message: 'Enter Partner Name (or "exit" to quit):',
    });

    if (!partner || partner.toLowerCase() === 'exit') break;

    const token = signToken(partner);
    const isValid = verifyToken(token);
    const [normalized, signature] = token.split(':');

    console.log(`\n🔧 Token Data`);
    console.log(`Raw Input:           ${partner}`);
    console.log(`Normalized Partner:  ${normalized}`);
    console.log(`Signature:           ${signature}`);
    console.log(`Full Token:          ${token}`);
    console.log(`\n✅ Verified: ${isValid ? 'VALID ✅' : 'INVALID ❌'}\n`);
    console.log('──────────────────────────────\n');
  }

  console.log('👋 Exiting...');
}

main();
