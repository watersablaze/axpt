import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables React's Strict Mode for better debugging
  typescript: {
    ignoreBuildErrors: false, // Ensure TypeScript errors don't block your builds
  },
  eslint: {
    ignoreDuringBuilds: false, // Ensure linting errors don't block your builds
  },
  output: "standalone", // Prepares the app for deployment as a standalone server
  images: {
    domains: ["example.com"], // Add domains for external images, if needed
  },
};

export default nextConfig;