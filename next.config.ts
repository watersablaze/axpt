const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  images: {
    formats: ["image/avif", "image/webp"], // ✅ Next.js will serve modern, compressed images
    domains: ["yourdomain.com"], // ✅ Ensures images load from your CDN
  },
  experimental: {
    optimizeCss: true, // ✅ Reduces CSS size for faster loading
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // ✅ Removes console logs in production
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

module.exports = nextConfig;