// 📁 app/src/types/next.ts

// This is the correct internal type for headers() in Next.js App Router (Edge-compatible)
export type ReadonlyHeaders = import('next/dist/server/web/spec-extension/adapters/headers').ReadonlyHeaders;