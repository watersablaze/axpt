import 'dotenv/config';
import chalk from 'chalk';

const requiredVars = [
  // Database
  'DATABASE_URL',
  'MONGODB_URI',

  // Auth
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',

  // JWT / AXPT
  'AXPT_JWT_SECRET',
  'AXPT_PARTNER_SALT',
  'JWT_SECRET',
  'PARTNER_SECRET',

  // Stripe
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',

  // Redis
  'SESSION_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',

  // Branding
  'SITE_NAME',
  'SITE_URL',
  'SITE_EMAIL',

  // Fonts
  'GOOGLE_FONTS_FALLBACK',
  'NEXT_FONT_FALLBACK',

  // Logging
  'ENVIRONMENT',
  'ENABLE_LOGGING',
  'DEBUG_MODE',

  // Public
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_API_URL',

  // Web3
  'NEXT_PUBLIC_ALCHEMY_API_KEY',
  'NEXT_PUBLIC_PROVIDER_URL',
  'NEXT_PUBLIC_CHAIN_ID',
  'CHAINLINK_PRICE_FEED',
  'WALLET_ADDRESS',
  'USER_SECRET_KEY',
];

let hasError = false;

console.log(chalk.blue(`🔍 Verifying ${requiredVars.length} environment variables...\n`));

for (const key of requiredVars) {
  const value = process.env[key];
  if (!value) {
    console.log(chalk.red(`❌ ${key} is missing or empty`));
    hasError = true;
  } else {
    console.log(chalk.green(`✅ ${key}`));
  }
}

if (hasError) {
  console.log(chalk.yellowBright('\n⚠️ One or more environment variables are missing.\n'));
  process.exit(1);
} else {
  console.log(chalk.cyanBright('\n🎉 All required environment variables are present.\n'));
  process.exit(0);
}