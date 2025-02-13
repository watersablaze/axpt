import { NextConfig } from "next";
import path from "path";
import fs from "fs";

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.json$/,
      type: "javascript/auto",
      include: [path.resolve(__dirname, "abi")], // ✅ Ensures JSON imports work
    });

    // ✅ Ensure ABI file is copied into `.next/` so Next.js can find it
    if (!isServer) {
      const abiSourcePath = path.resolve(__dirname, "abi/GoldPeggedStablecoin.json");
      const abiDestPath = path.resolve(__dirname, ".next/GoldPeggedStablecoin.json");

      if (fs.existsSync(abiSourcePath)) {
        fs.copyFileSync(abiSourcePath, abiDestPath);
        console.log("✅ Copied ABI file to .next/");
      } else {
        console.error("❌ ABI file missing: frontend/abi/GoldPeggedStablecoin.json");
      }
    }

    return config;
  },
};

export default nextConfig;