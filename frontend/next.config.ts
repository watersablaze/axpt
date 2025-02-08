import { NextConfig } from 'next';

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL, // ✅ Safe to expose
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY, // ✅ Safe for client-side use
  },
  serverRuntimeConfig: {
    PRIVATE_KEY: process.env.PRIVATE_KEY, // ✅ Kept secure on the server
  },
};

export default nextConfig;