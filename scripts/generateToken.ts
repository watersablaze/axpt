// scripts/generateToken.ts
import { generateTokenSignature } from '../lib/tokenUtils';

const token = process.argv[2];

if (!token) {
  console.error('⚠️ Please provide a token string as an argument.');
  process.exit(1);
}

const signature = generateTokenSignature(token);

console.log(`Token: ${token}`);
console.log(`Signature: ${signature}`);