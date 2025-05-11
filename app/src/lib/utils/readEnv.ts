// File: app/scripts/partner/utils/readEnv.ts
export const getEnv = (key: string): string => {
    const val = process.env[key];
    if (!val) {
      console.error(`\u274C Missing required environment variable: ${key}`);
      process.exit(1);
    }
    return val;
  };