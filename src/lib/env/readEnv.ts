// 📁 src/lib/env/readEnv.ts
import 'dotenv/config'; // ✅ This line is required here!

export const env = {
  SIGNING_SECRET: process.env.SIGNING_SECRET ?? (() => {
    throw new Error('[AXPT] ❌ SIGNING_SECRET is not defined in environment variables');
  })(),

  LOG_SECRET: process.env.LOG_SECRET ?? (() => {
    throw new Error('[AXPT] ❌ LOG_SECRET is not defined in environment variables');
  })(),
};