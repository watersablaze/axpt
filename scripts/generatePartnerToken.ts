import crypto from 'crypto';
import * as readline from 'readline';
import { config } from 'dotenv';

// Load environment variables from .env
config();

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'your-fallback-secret';

// Generate token signature using HMAC-SHA256
function generateTokenSignature(token: string): string {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(token).digest('hex');
}

// Interactive CLI to get partner name and generate token
function promptAndGenerateToken() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('📝 Enter Partner Name: ', (partnerName) => {
    if (!partnerName.trim()) {
      console.error('❌ Partner name cannot be empty!');
      rl.close();
      return;
    }

    const token = `${partnerName}-${crypto.randomUUID()}`;
    const signature = generateTokenSignature(token);
    const timestamp = new Date().toISOString();

    console.log('\n🎉 Partner Token Generated Successfully!');
    console.log(`🔐 Partner Name: ${partnerName}`);
    console.log(`🪙 Token: ${token}`);
    console.log(`✍️ Signature: ${signature}`);
    console.log(`🕒 Timestamp: ${timestamp}`);
    console.log(`\n➡️ Provide the token & signature as query params to the partner (or embed into QR codes).\n`);
    
    rl.close();
  });
}

promptAndGenerateToken();