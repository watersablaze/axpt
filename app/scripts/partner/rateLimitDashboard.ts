// File: app/scripts/partner/rateLimitDashboard.ts
import 'dotenv/config';
import { Redis } from '@upstash/redis';
import prompts from 'prompts';
import { getEnv } from '@/lib/utils/readEnv';

const redis = new Redis({
  url: getEnv('UPSTASH_REDIS_REST_URL'),
  token: getEnv('UPSTASH_REDIS_REST_TOKEN'),
});

async function listRateLimitedIPs() {
  const keys = await redis.keys('rate:*');
  if (keys.length === 0) {
    console.log('\n✅ No active rate limits found.\n');
    return;
  }

  console.log(`\n🧾 Rate Limited IPs (${keys.length})\n──────────────────────────────`);
  for (const key of keys) {
    const count = await redis.get<number>(key);
    const ttl = await redis.ttl(key);
    const ip = key.replace('rate:', '');
    console.log(`IP: ${ip} → Attempts: ${count} → TTL: ${ttl}s`);
  }
  console.log('──────────────────────────────\n');
}

async function resetRateLimit(ip: string) {
  const key = `rate:${ip}`;
  await redis.del(key);
  console.log(`\n🧹 Cleared rate limit for IP: ${ip}\n`);
}

async function main() {
  console.clear();
  console.log('🧿 AXPT Rate Limit Dashboard');
  console.log('──────────────────────────────\n');

  const action = await prompts({
    type: 'select',
    name: 'mode',
    message: 'Choose an action:',
    choices: [
      { title: '📋 View Active Rate Limited IPs', value: 'view' },
      { title: '🧹 Reset Rate Limit for IP', value: 'reset' },
      { title: '🚪 Exit', value: 'exit' },
    ],
  });

  switch (action.mode) {
    case 'view':
      await listRateLimitedIPs();
      break;
    case 'reset':
      const response = await prompts({
        type: 'text',
        name: 'ip',
        message: 'Enter IP to reset:'
      });
      if (response.ip) await resetRateLimit(response.ip);
      break;
    case 'exit':
    default:
      console.log('\n👋 Exiting dashboard.\n');
      process.exit(0);
  }
}

main();
