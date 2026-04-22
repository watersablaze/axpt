import { env } from './readEnv';

// ✅ This is safe — runs only in Node
if (typeof process !== 'undefined' && typeof process.exit === 'function') {
  const requiredEnvVars = ['SIGNING_SECRET', 'DATABASE_URL'];
  for (const key of requiredEnvVars) {
    const val = process.env[key];
    if (!val) {
      console.error(`❌ Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }
}

export { env };