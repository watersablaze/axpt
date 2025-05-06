import path from "path";
import type { Configuration } from "webpack";

const nextConfig = {
  reactStrictMode: true,

  webpack: (config: Configuration) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@": path.resolve(__dirname, "src"),         // ✅ Main alias
        "@/lib": path.resolve(__dirname, "src/lib"), // ✅ Sub-path alias
        "@/abi": path.resolve(__dirname, "abi")      // ✅ External dir alias
      },
      fallback: {
        ...config.resolve?.fallback,
        canvas: false // For react-pdf
      }
    };
    return config;
  },

  images: {
    formats: ["image/avif", "image/webp"],
    domains: ["yourdomain.com"]
  },

  experimental: {
    optimizeCss: true
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },

  eslint: {
    ignoreDuringBuilds: true
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/landing",
        permanent: true
      }
    ];
  }
};

export default nextConfig;