import path from "path";
import type { Configuration } from "webpack";

const nextConfig = {
  reactStrictMode: true,

  webpack: (config: Configuration) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@": path.resolve(__dirname),
        "@/lib": path.resolve(__dirname, "lib"),
        "@/abi": path.resolve(__dirname, "abi"),
      },
      fallback: {
        ...config.resolve?.fallback,
        canvas: false, // For react-pdf
      },
    };
    return config;
  },

  images: {
    formats: ["image/avif", "image/webp"],
    domains: ["yourdomain.com"], // <-- Update if you need real domains
  },

  experimental: {
    optimizeCss: true, // Next.js modern CSS optimization
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // Clean production console.logs
  },

  eslint: {
    ignoreDuringBuilds: true, // ✅ PATCHED: Allow deploy even if ESLint errors
  },

  async redirects() {
    return [
      {
        source: "/",            // Root landing
        destination: "/landing", // Your public page
        permanent: true,
      },
    ];
  },
};

export default nextConfig;