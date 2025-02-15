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
};

export default nextConfig;