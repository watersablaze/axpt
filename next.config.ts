import path from "path";
import { NextConfig } from "next";

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/abi": path.resolve(__dirname, "abi"),
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: "/", // Redirect visitors from "/"
        destination: "/landing", // Send them to "/landing"
        permanent: true, // Marks as a permanent redirect (SEO friendly)
      },
    ];
  },
};

export default nextConfig;