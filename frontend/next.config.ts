import { NextConfig } from 'next';
import path from 'path';

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
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: "javascript/auto",
      include: [path.resolve(__dirname, "abi")], // ✅ Adjusted to match `frontend/abi`
    });
    return config;
  },
};

export default nextConfig;