// scripts/verify.mjs
import { jwtVerify, decodeJwt } from 'jose';

const [,, rawTokenArg, rawSecretArg] = process.argv;

if (!rawTokenArg || !rawSecretArg) {
  console.error('Usage: node scripts/verify.mjs "<JWT>" "<SECRET>"');
  process.exit(1);
}

// Normalize inputs
const token = String(rawTokenArg)
  .trim()
  .replace(/^Bearer\s+/i, '')       // strip Bearer prefix if present
  .replace(/\s+/g, '');             // remove whitespace/newlines

// Pre-flight shape check: exactly 2 dots
const dotCount = (token.match(/\./g) || []).length;
if (dotCount !== 2) {
  console.error(`❌ Not a compact JWS (dotCount=${dotCount}). Make sure your token is a single line "header.payload.signature".`);
  process.exit(1);
}

const secretRaw = String(rawSecretArg).trim();
const secret = new TextEncoder().encode(secretRaw);

try {
  // Optional: decode without verifying for a quick peek
  const decoded = decodeJwt(token);
  console.log('🔎 Decoded header/payload (unverified):');
  console.log(JSON.stringify(decoded, null, 2));

  // Verify signature
  const { payload, protectedHeader } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
    clockTolerance: 60,
  });

  console.log('✅ Verified!');
  console.log('Protected Header:', protectedHeader);
  console.log('Payload:', payload);
} catch (e) {
  console.error('❌ Verification failed:', e.name, e.code ?? '', e.message);
  process.exit(1);
}