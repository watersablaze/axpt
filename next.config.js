const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  productionBrowserSourceMaps: true,

  compiler: {
    // Strip console.* only in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  experimental: {
    optimizeCss: true,
    serverActions: {},
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    domains: ["yourdomain.com"], // Replace as needed
  },

  webpack: (config, { isServer }) => {
    // ⛑ Prevent critical dependency failures in jose/crypto libs
    config.module.exprContextCritical = false;

    // 💫 Aliases for absolute imports
    config.resolve = {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias || {}),
        "@": path.resolve(__dirname, "app/src"),
        "@/components": path.resolve(__dirname, "app/src/components"),
        "@/lib": path.resolve(__dirname, "app/src/lib"),
        "@/lotties": path.resolve(__dirname, "app/src/lotties"),
      },
      fallback: {
        ...(config.resolve?.fallback || {}),
        canvas: false, // For react-pdf or pdfjs-dist
      },
    };

    // 🎯 Optional: customize chunk output in browser
    if (!isServer) {
      config.output = {
        ...config.output,
        chunkFilename: "static/chunks/[name].[contenthash].js",
      };
    }

    return config;
  },

  // 🌍 Redirect root to landing
  async redirects() {
    return [
      {
        source: "/",
        destination: "/landing",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;