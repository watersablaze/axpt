// next.config.js

const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,

  compiler: {
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
        canvas: false, // for react-pdf
      },
    };

    if (!isServer) {
      config.output = {
        ...config.output,
        chunkFilename: "static/chunks/[name].[contenthash].js",
      };
    }

    return config;
  },

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
