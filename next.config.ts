/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  },
};

export default nextConfig;